/**
 * Unified Payment Provider Interface
 * Makes the system future-proof for Stripe, PayPal, other cryptos, etc.
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
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  status: PaymentStatus;
  externalId?: string;
  amountReceived?: number;
  raw?: any;
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
    metadata?: Record<string, any>;
  }): Promise<PaymentSession>;

  verifyPayment(params: {
    paymentId: string;
    externalId?: string;
  }): Promise<PaymentVerificationResult>;

  handleWebhook?(payload: any, headers?: Record<string, string>): Promise<void>;
}
