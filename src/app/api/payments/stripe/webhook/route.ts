import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeProvider } from "@/lib/payments/stripe";
import { fulfillVerifiedPayment } from "@/lib/payments/fulfill";
import { paymentAmountsMatch } from "@/lib/payments/amount";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => { headers[key] = value; });
    const event = await stripeProvider.handleWebhook(raw, headers);
    if (event.type === "invoice.paid" && event.paid && event.providerSubscriptionId && event.periodStart && event.periodEnd) {
      await prisma.subscription.updateMany({
        where: { providerSubscriptionId: event.providerSubscriptionId, currentPeriodEnd: { lt: event.periodEnd } },
        data: { status: "ACTIVE", currentPeriodStart: event.periodStart, currentPeriodEnd: event.periodEnd },
      });
      return NextResponse.json({ received: true, type: event.type });
    }
    if (!event.paid || !event.sessionId) return NextResponse.json({ received: true, type: event.type });

    const paymentId = event.metadata?.paymentId;
    if (!paymentId) return NextResponse.json({ error: "Payment reference missing from Stripe metadata" }, { status: 400 });
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.provider !== "stripe") return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    if (payment.externalId && payment.externalId !== event.sessionId) return NextResponse.json({ error: "Stripe session does not match payment" }, { status: 409 });
    if (event.metadata?.userId !== payment.userId || (event.metadata?.orderId || null) !== payment.orderId || (event.metadata?.planId || null) !== payment.planId) {
      return NextResponse.json({ error: "Stripe metadata does not match payment" }, { status: 409 });
    }

    const result = await stripeProvider.verifyPayment({ paymentId: payment.id, externalId: event.sessionId });
    if (result.status !== "completed" || result.amountReceived == null || result.currency?.toUpperCase() !== payment.currency.toUpperCase()) {
      return NextResponse.json({ error: "Stripe session is not a matching paid session" }, { status: 409 });
    }
    const amount = typeof payment.amount === "number" ? payment.amount : payment.amount.toNumber();
    if (!paymentAmountsMatch(amount, result.amountReceived, payment.currency)) return NextResponse.json({ error: "Stripe amount does not match payment" }, { status: 409 });

    const outcome = await fulfillVerifiedPayment({
      paymentId: payment.id,
      provider: "stripe",
      externalId: event.sessionId,
      providerSubscriptionId: result.providerSubscriptionId,
      periodStart: result.periodStart,
      periodEnd: result.periodEnd,
    });
    return NextResponse.json({ received: true, status: outcome.status, duplicate: outcome.duplicate });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("stripe/webhook", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
