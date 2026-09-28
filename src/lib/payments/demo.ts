import { randomUUID } from "node:crypto";
import type { PaymentProvider, PaymentSession, PaymentVerificationResult } from "./base";

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo";

  async createPayment(params: {
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentSession> {
    const id = `demo_${randomUUID()}`;
    return {
      id,
      provider: this.name,
      amount: params.amount,
      currency: params.currency,
      status: "pending",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      metadata: { ...params.metadata, orderId: params.orderId, planId: params.subscriptionId, userId: params.userId },
    };
  }

  async verifyPayment(params: { paymentId: string; externalId?: string }): Promise<PaymentVerificationResult> {
    const id = params.externalId || params.paymentId;
    if (process.env.NODE_ENV === "production" || !id.startsWith("demo_")) {
      return { status: "failed", verifiedAt: new Date(), raw: { error: "Demo payments are disabled" } };
    }
    return { status: "completed", externalId: id, verifiedAt: new Date(), raw: { provider: "demo" } };
  }
}

export const demoProvider = new DemoPaymentProvider();
