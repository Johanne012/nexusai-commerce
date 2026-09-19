import { PaymentProvider, PaymentSession, PaymentVerificationResult } from "./base";

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo";

  async createPayment(params: {
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    userId: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentSession> {
    return {
      id: `demo_${Date.now()}`,
      provider: this.name,
      amount: params.amount,
      currency: params.currency || "XRP",
      status: "pending",
      paymentUrl: `/pay/demo/${Date.now()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      metadata: params.metadata,
    };
  }

  async verifyPayment(params: { paymentId: string; externalId?: string }): Promise<PaymentVerificationResult> {
    return {
      status: "completed",
      externalId: params.externalId || params.paymentId,
      amountReceived: 0,
      verifiedAt: new Date(),
      raw: { provider: "demo" },
    };
  }
}

export const demoProvider = new DemoPaymentProvider();
