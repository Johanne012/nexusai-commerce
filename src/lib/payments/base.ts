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
  currency?: string;
  metadata?: Record<string, string>;
  providerSubscriptionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  raw?: unknown;
  verifiedAt: Date;
}

export interface PaymentWebhookEvent {
  eventId: string;
  type: string;
  sessionId?: string;
  paid: boolean;
  metadata?: Record<string, string>;
  providerSubscriptionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
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
  handleWebhook?(payload: string | Buffer, headers?: Record<string, string>): Promise<PaymentWebhookEvent>;
}
