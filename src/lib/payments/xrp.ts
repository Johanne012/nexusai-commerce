/**
 * XRP Payment Provider
 * Uses XRPL + XRPSCAN API for verification
 */

import { PaymentProvider, PaymentSession, PaymentVerificationResult } from "./base";

const XRPSCAN_API = process.env.XRPSCAN_API_URL || "https://api.xrpscan.com/api/v1";
const PLATFORM_XRPL_ADDRESS = process.env.PLATFORM_XRPL_ADDRESS || "";
const PLATFORM_DESTINATION_TAG_BASE = 100000;

interface XrpscanTransaction {
  hash: string;
  Account: string;
  Destination: string;
  DestinationTag?: number;
  Amount: string | { value: string; currency: string };
  date: string;
  meta?: {
    TransactionResult: string;
    delivered_amount?: any;
  };
  ledger_index: number;
}

export class XrpPaymentProvider implements PaymentProvider {
  readonly name = "xrp";

  async createPayment(params: {
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    userId: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentSession> {
    if (!PLATFORM_XRPL_ADDRESS) {
      throw new Error("PLATFORM_XRPL_ADDRESS is not configured");
    }

    const uniquePart = params.orderId || params.subscriptionId || Date.now().toString();
    const destinationTag = this.generateDestinationTag(uniquePart);
    const sessionId = `xrp_${Date.now()}_${destinationTag}`;

    return {
      id: sessionId,
      provider: this.name,
      amount: params.amount,
      currency: "XRP",
      status: "pending",
      destinationAddress: PLATFORM_XRPL_ADDRESS,
      destinationTag,
      qrCodeData: `xrp:${PLATFORM_XRPL_ADDRESS}?amount=${params.amount}&dt=${destinationTag}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      metadata: {
        orderId: params.orderId,
        subscriptionId: params.subscriptionId,
        userId: params.userId,
        ...params.metadata,
      },
    };
  }

  async verifyPayment(params: {
    paymentId: string;
    externalId?: string;
    expectedAmount?: number;
    expectedTag?: number;
  }): Promise<PaymentVerificationResult> {
    try {
      if (params.externalId) {
        return await this.verifyByTxHash(params.externalId, params.expectedAmount, params.expectedTag);
      }

      return {
        status: "pending",
        verifiedAt: new Date(),
        raw: { message: "Provide txHash for verification" },
      };
    } catch (error: any) {
      return {
        status: "failed",
        verifiedAt: new Date(),
        raw: { error: error.message },
      };
    }
  }

  private async verifyByTxHash(
    txHash: string,
    expectedAmount?: number,
    expectedTag?: number
  ): Promise<PaymentVerificationResult> {
    const url = `${XRPSCAN_API}/tx/${txHash}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      return {
        status: "failed",
        verifiedAt: new Date(),
        raw: { error: `XRPSCAN returned ${response.status}` },
      };
    }

    const tx: XrpscanTransaction = await response.json();

    if (tx.meta?.TransactionResult !== "tesSUCCESS") {
      return { status: "failed", externalId: txHash, verifiedAt: new Date(), raw: tx };
    }

    if (tx.Destination !== PLATFORM_XRPL_ADDRESS) {
      return {
        status: "failed",
        externalId: txHash,
        verifiedAt: new Date(),
        raw: { ...tx, reason: "Wrong destination address" },
      };
    }

    if (expectedTag && tx.DestinationTag !== expectedTag) {
      return {
        status: "failed",
        externalId: txHash,
        verifiedAt: new Date(),
        raw: { ...tx, reason: "Destination Tag mismatch" },
      };
    }

    let amountReceived = 0;
    if (typeof tx.Amount === "string") {
      amountReceived = parseInt(tx.Amount, 10) / 1_000_000;
    } else if (tx.Amount?.value) {
      amountReceived = parseFloat(tx.Amount.value);
    }

    if (expectedAmount && Math.abs(amountReceived - expectedAmount) > 0.0001) {
      return {
        status: "failed",
        externalId: txHash,
        amountReceived,
        verifiedAt: new Date(),
        raw: { ...tx, reason: "Amount mismatch" },
      };
    }

    return {
      status: "completed",
      externalId: txHash,
      amountReceived,
      verifiedAt: new Date(),
      raw: tx,
    };
  }

  private generateDestinationTag(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 900000 + PLATFORM_DESTINATION_TAG_BASE;
  }
}

export const xrpProvider = new XrpPaymentProvider();
