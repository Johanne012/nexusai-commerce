import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider, listAvailableProviders } from "@/lib/payments";
import { getPlan } from "@/lib/subscriptions";

const requestSchema = z.object({
  provider: z.enum(["auto", "stripe", "xrp", "demo"]).optional(),
  orderId: z.string().min(1).max(100).optional(),
  planId: z.enum(["pro", "enterprise"]).optional(),
}).refine((value) => Boolean(value.orderId) !== Boolean(value.planId), "Provide exactly one orderId or planId");

const amountNumber = (value: { toNumber(): number } | number | null | undefined) => value == null ? null : typeof value === "number" ? value : value.toNumber();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const planId = searchParams.get("planId");
  const providers = listAvailableProviders();
  if (!orderId && !planId) return NextResponse.json({ providers });
  if (Boolean(orderId) === Boolean(planId)) return NextResponse.json({ error: "حدد طلبًا أو خطة واحدة" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  if (orderId) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId, status: "PENDING" } });
    if (!order) return NextResponse.json({ error: "الطلب غير موجود أو غير قابل للدفع" }, { status: 404 });
    const xrp = amountNumber(order.totalXrp) || 0;
    return NextResponse.json({ providers, quote: { xrp, usd: amountNumber(order.totalUsd) ?? xrp * Number(process.env.XRP_USD_RATE || "0.6") } });
  }
  const plan = getPlan(planId!);
  return NextResponse.json({ providers, quote: { xrp: plan.priceXrp, usd: plan.priceUsd ?? plan.priceXrp * Number(process.env.XRP_USD_RATE || "0.6") } });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات الدفع غير صالحة", details: parsed.error.flatten() }, { status: 400 });
    const { orderId, planId } = parsed.data;
    const provider = getPaymentProvider(parsed.data.provider || "auto");
    if (provider.name === "demo" && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "الدفع التجريبي معطل في الإنتاج" }, { status: 503 });
    }

    let amountXrp: number;
    let amountUsd: number;
    const currency = provider.name === "stripe" ? "USD" : "XRP";
    let title: string;
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId, status: "PENDING" },
        include: { items: true },
      });
      if (!order) return NextResponse.json({ error: "الطلب غير موجود أو غير قابل للدفع" }, { status: 404 });
      amountXrp = amountNumber(order.totalXrp) || 0;
      amountUsd = amountNumber(order.totalUsd) ?? amountXrp * Number(process.env.XRP_USD_RATE || "0.6");
      title = order.orderNumber;
    } else {
      const plan = getPlan(planId!);
      amountXrp = plan.priceXrp;
      amountUsd = plan.priceUsd ?? amountXrp * Number(process.env.XRP_USD_RATE || "0.6");
      title = plan.id;
    }
    const amount = provider.name === "stripe" ? amountUsd : amountXrp;
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "المبلغ المحسوب غير صالح" }, { status: 400 });

    const intentLockKey = `payment-intent:${userId}:${orderId ? `order:${orderId}` : "subscription"}`;
    const reservation = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`WITH lock_result AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtextextended(${intentLockKey}, 0))) SELECT 1 AS locked FROM lock_result`;
      const existingPayment = await tx.payment.findFirst({
        where: { userId, status: "PENDING", ...(orderId ? { orderId } : { planId: { not: null } }) },
        orderBy: { createdAt: "desc" },
      });
      if (existingPayment) {
        let savedSession: Record<string, unknown> | null = null;
        try { savedSession = existingPayment.rawData ? JSON.parse(existingPayment.rawData) as Record<string, unknown> : null; } catch { savedSession = null; }
        const expiresAt = savedSession?.expiresAt ? new Date(String(savedSession.expiresAt)) : null;
        const sameIntent = orderId ? existingPayment.orderId === orderId : existingPayment.planId === planId;
        if (sameIntent && existingPayment.provider === provider.name && existingPayment.externalId && savedSession && expiresAt && expiresAt.getTime() > Date.now()) {
          return { kind: "reuse" as const, paymentId: existingPayment.id, provider: existingPayment.provider, session: savedSession };
        }
        if (!expiresAt || expiresAt.getTime() > Date.now()) return { kind: "conflict" as const };
        await tx.payment.update({ where: { id: existingPayment.id }, data: { status: "EXPIRED" } });
      }
      if (planId) {
        const active = await tx.subscription.findFirst({ where: { userId, status: "ACTIVE", currentPeriodEnd: { gt: new Date() } } });
        if (active && active.planId !== "free") return { kind: "active" as const };
      }
      const payment = await tx.payment.create({
        data: {
          userId,
          orderId: orderId || null,
          planId: planId || null,
          provider: provider.name,
          amount,
          currency,
          status: "PENDING",
        },
      });
      return { kind: "create" as const, payment };
    });
    if (reservation.kind === "reuse") return NextResponse.json({ success: true, session: reservation.session, paymentId: reservation.paymentId, provider: reservation.provider, reused: true });
    if (reservation.kind === "conflict") return NextResponse.json({ error: "لديك جلسة دفع معلقة لهذا الطلب أو الاشتراك. أكملها أو انتظر انتهاء صلاحيتها قبل إنشاء جلسة أخرى." }, { status: 409 });
    if (reservation.kind === "active") return NextResponse.json({ error: "لديك اشتراك مدفوع نشط بالفعل؛ ألغِ التجديد أو انتظر انتهاء فترته قبل شراء خطة أخرى." }, { status: 409 });
    const payment = reservation.payment;

    try {
      const paySession = await provider.createPayment({
        orderId,
        subscriptionId: planId,
        amount,
        currency,
        userId,
        metadata: { paymentId: payment.id, planId: planId || "", orderId: orderId || "", title },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: paySession.id,
          destinationTag: paySession.destinationTag ?? null,
          rawData: JSON.stringify(paySession),
        },
      });
      if (orderId) await prisma.order.update({ where: { id: orderId }, data: { paymentId: payment.id, paymentProvider: provider.name, destinationTag: paySession.destinationTag ?? null } });
      return NextResponse.json({ success: true, session: paySession, paymentId: payment.id, provider: provider.name });
    } catch (error) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      throw error;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "فشل إنشاء الدفع";
    console.error("payments/create", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
