import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { fulfillVerifiedPayment } from "@/lib/payments/fulfill";
import { paymentAmountsMatch } from "@/lib/payments/amount";

const bodySchema = z.object({
  paymentId: z.string().min(1).max(160).optional(),
  sessionId: z.string().min(1).max(160).optional(),
  txHash: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
  provider: z.enum(["stripe", "xrp", "demo"]).optional(),
});
const asNumber = (value: { toNumber(): number } | number) => typeof value === "number" ? value : value.toNumber();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : undefined;
    if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "بيانات التحقق غير صالحة" }, { status: 400 });
    const { paymentId, sessionId, txHash } = parsed.data;
    if (!paymentId && !sessionId) return NextResponse.json({ error: "paymentId أو sessionId مطلوب" }, { status: 400 });

    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        OR: [
          ...(paymentId ? [{ id: paymentId }] : []),
          ...(sessionId ? [{ externalId: sessionId }] : []),
        ],
      },
    });
    if (!payment) return NextResponse.json({ error: "سجل الدفع غير موجود" }, { status: 404 });
    if (parsed.data.provider && parsed.data.provider !== payment.provider) return NextResponse.json({ error: "مزود الدفع لا يطابق السجل" }, { status: 400 });
    if (payment.status === "COMPLETED") return NextResponse.json({ success: true, status: "completed", duplicate: true });
    if (payment.status !== "PENDING") return NextResponse.json({ error: `الدفع حالته ${payment.status}` }, { status: 409 });

    const provider = getPaymentProvider(payment.provider);
    if (provider.name === "xrp" && !txHash) return NextResponse.json({ error: "txHash مطلوب للتحقق من XRP" }, { status: 400 });
    const result = await provider.verifyPayment({
      paymentId: payment.id,
      externalId: provider.name === "xrp" ? txHash : payment.externalId || sessionId,
      expectedAmount: provider.name === "xrp" ? asNumber(payment.amount) : undefined,
      expectedTag: provider.name === "xrp" ? payment.destinationTag ?? undefined : undefined,
    });
    if (result.status !== "completed") return NextResponse.json({ success: false, status: result.status, message: "لم يتم تأكيد الدفعة" }, { status: 200 });

    const expectedAmount = asNumber(payment.amount);
    if (result.amountReceived != null && !paymentAmountsMatch(expectedAmount, result.amountReceived, payment.currency)) {
      return NextResponse.json({ error: "المبلغ المدفوع لا يطابق سجل الدفع" }, { status: 409 });
    }
    if (result.currency && result.currency.toUpperCase() !== payment.currency.toUpperCase()) {
      return NextResponse.json({ error: "عملة الدفع لا تطابق سجل الدفع" }, { status: 409 });
    }
    if (provider.name === "stripe") {
      const metadata = result.metadata || {};
      if (metadata.paymentId !== payment.id || metadata.userId !== payment.userId || (metadata.orderId || null) !== payment.orderId || (metadata.planId || null) !== payment.planId) {
        return NextResponse.json({ error: "بيانات جلسة Stripe لا تطابق سجل الدفع" }, { status: 409 });
      }
    }
    if (provider.name === "xrp" && !payment.destinationTag) return NextResponse.json({ error: "لا يوجد Destination Tag محفوظ لهذا الدفع" }, { status: 409 });

    const fulfilled = await fulfillVerifiedPayment({
      paymentId: payment.id,
      provider: payment.provider,
      externalId: provider.name === "stripe" ? payment.externalId || result.externalId! : payment.externalId || result.externalId!,
      transactionHash: provider.name === "xrp" ? txHash : undefined,
      providerSubscriptionId: result.providerSubscriptionId,
      periodStart: result.periodStart,
      periodEnd: result.periodEnd,
    });
    return NextResponse.json({ success: fulfilled.status === "completed", status: fulfilled.status, duplicate: fulfilled.duplicate });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "فشل التحقق من الدفع";
    console.error("payments/verify", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
