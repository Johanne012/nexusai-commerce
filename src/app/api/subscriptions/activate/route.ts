import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, calculatePeriodEnd } from "@/lib/subscriptions";
import { stripeProvider } from "@/lib/payments/stripe";

const schema = z.object({ planId: z.literal("free") });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "لا يمكن تفعيل الخطط المدفوعة دون مسار دفع موثوق" }, { status: 403 });

  const now = new Date();
  const active = await prisma.subscription.findFirst({ where: { userId, status: "ACTIVE", currentPeriodEnd: { gt: now } }, orderBy: { currentPeriodEnd: "desc" } });
  if (active && active.planId !== "free") {
    let periodEnd = active.currentPeriodEnd;
    if (active.paymentProvider === "stripe") {
      if (!active.providerSubscriptionId) return NextResponse.json({ error: "اشتراك Stripe غير مرتبط بمعرف المزود؛ تواصل مع الإدارة بدل إجراء تغيير غير آمن." }, { status: 409 });
      try { periodEnd = await stripeProvider.cancelAtPeriodEnd(active.providerSubscriptionId); }
      catch (error) { console.error("subscription cancellation failed", error); return NextResponse.json({ error: "تعذر إلغاء تجديد Stripe. لم يتم تغيير اشتراكك." }, { status: 502 }); }
    }
    const updated = await prisma.subscription.update({ where: { id: active.id }, data: { cancelAtPeriodEnd: true, currentPeriodEnd: periodEnd } });
    return NextResponse.json({ subscription: updated, cancelAtPeriodEnd: true, message: "سيبقى اشتراكك فعالًا حتى نهاية الفترة المدفوعة، ولن يبدأ تجديد جديد." });
  }
  if (active?.planId === "free") return NextResponse.json({ subscription: active, plan: getPlan("free"), reused: true });

  const plan = getPlan("free");
  const subscription = await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({ where: { userId, status: "ACTIVE" }, data: { status: "CANCELLED", cancelAtPeriodEnd: false } });
    return tx.subscription.create({ data: { userId, planId: plan.id, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: calculatePeriodEnd(now), paymentProvider: "none" } });
  });
  return NextResponse.json({ subscription, plan });
}
