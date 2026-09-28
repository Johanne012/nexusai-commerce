import { prisma } from "@/lib/prisma";
import { calculatePeriodEnd, getPlan } from "@/lib/subscriptions";
import type { PaymentStatus } from "./base";

const close = (a: number, b: number, tolerance = 0.00000001) => Math.abs(a - b) <= tolerance;
const num = (value: { toNumber(): number } | number | null | undefined) => value == null ? 0 : typeof value === "number" ? value : value.toNumber();

export async function fulfillVerifiedPayment(input: {
  paymentId: string;
  provider: string;
  externalId: string;
  transactionHash?: string;
  providerSubscriptionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
}): Promise<{ status: "completed" | "refund_required"; duplicate: boolean }> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment) throw new Error("Payment record not found");
    if (payment.provider !== input.provider) throw new Error("Payment provider mismatch");
    if (payment.status === "COMPLETED") return { status: "completed", duplicate: true };
    if (payment.status !== "PENDING") throw new Error("Payment is not pending");

    if (payment.orderId) {
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true },
      });
      if (!order || order.userId !== payment.userId) throw new Error("Payment/order ownership mismatch");
      const stripe = input.provider === "stripe";
      const expectedAmount = stripe
        ? num(order.totalUsd) || num(order.totalXrp) * Number(process.env.XRP_USD_RATE || "0.6")
        : num(order.totalXrp);
      const expectedCurrency = stripe ? "USD" : "XRP";
      if (payment.currency !== expectedCurrency || !close(num(payment.amount), expectedAmount, 0.005)) {
        throw new Error("Payment does not match the order total");
      }

      const updated = await tx.order.updateMany({
        where: { id: order.id, userId: payment.userId, status: "PENDING" },
        data: { status: "COMPLETED", paymentProvider: input.provider, paymentId: payment.id },
      });
      if (updated.count !== 1) {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUND_REQUIRED", verifiedAt: new Date() } });
        return { status: "refund_required", duplicate: false };
      }
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { downloadCount: { increment: item.quantity } } });
      }
    } else if (payment.planId) {
      const plan = getPlan(payment.planId);
      if (plan.id === "free") throw new Error("Free plans cannot use paid checkout");
      const stripe = input.provider === "stripe";
      const expectedAmount = stripe
        ? plan.priceUsd ?? plan.priceXrp * Number(process.env.XRP_USD_RATE || "0.6")
        : plan.priceXrp;
      const expectedCurrency = stripe ? "USD" : "XRP";
      if (payment.currency !== expectedCurrency || !close(num(payment.amount), expectedAmount, 0.005)) {
        throw new Error("Payment does not match the subscription plan");
      }
      const now = new Date();
      const activeSubscription = await tx.subscription.findFirst({ where: { userId: payment.userId, status: "ACTIVE", currentPeriodEnd: { gt: now } } });
      if (activeSubscription && activeSubscription.planId !== "free") {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUND_REQUIRED", verifiedAt: new Date() } });
        return { status: "refund_required", duplicate: false };
      }
      if (input.provider === "stripe" && !input.providerSubscriptionId) throw new Error("Stripe recurring subscription reference missing");
      const periodStart = input.periodStart ?? now;
      const periodEnd = input.periodEnd ?? calculatePeriodEnd(periodStart);
      if (periodEnd <= periodStart || periodEnd <= now) throw new Error("Invalid subscription period returned by provider");
      await tx.subscription.updateMany({
        where: { userId: payment.userId, status: "ACTIVE" },
        data: { status: "CANCELLED", cancelAtPeriodEnd: false },
      });
      const subscription = await tx.subscription.create({
        data: {
          userId: payment.userId,
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          paymentProvider: input.provider,
          providerSubscriptionId: input.providerSubscriptionId ?? null,
        },
      });
      await tx.payment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });
    } else {
      throw new Error("Payment is not linked to an order or plan");
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        externalId: input.externalId,
        transactionHash: input.transactionHash,
        verifiedAt: new Date(),
      },
    });
    void updatedPayment;
    return { status: "completed", duplicate: false };
  });
}

export function paymentStatusCanBeVerified(status: string): status is "PENDING" | "COMPLETED" {
  return status === "PENDING" || status === "COMPLETED";
}

export type VerifiedPaymentState = PaymentStatus;
