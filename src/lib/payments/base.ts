/**
 * Unified Payment Provider Interface
 * Future-proof for XRP, Demo, Stripe, agentic rails
 */

export type PaymentStatus = "pending" | "completed" | "failed" | "expired" | "cancelled";

export interface PaymentSession {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentUrl?: string;
  qrCodeData?: string;
  destinationAddress?: string;
  destinationTag?: number;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerificationResult {
  status: PaymentStatus;
  externalId?: string;
  amountReceived?: number;
  raw?: unknown;
  verifiedAt: Date;
}

export interface PaymentProvider {
  readonly name: string;

  createPayment(params: {
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentSession>;

  verifyPayment(params: {
    paymentId: string;
    externalId?: string;
    expectedAmount?: number;
    expectedTag?: number;
  }): Promise<PaymentVerificationResult>;

  handleWebhook?(payload: unknown, headers?: Record<string, string>): Promise<void>;
}
