import { randomInt } from "node:crypto";
import type { PaymentProvider, PaymentSession, PaymentVerificationResult } from "./base";
import { hasValidXrpExpectation, isValidXrpTransactionHash, paymentAmountsMatch } from "./amount";

const XRPSCAN_API = (process.env.XRPSCAN_API_URL || "https://api.xrpscan.com/api/v1").replace(/\/$/, "");
const PLATFORM_XRPL_ADDRESS = (process.env.PLATFORM_XRPL_ADDRESS || "").trim();

interface XrpscanTransaction {
  hash: string;
  TransactionType: string;
  Account: string;
  Destination: string;
  DestinationTag?: number;
  Amount: string | { value: string; currency: string };
  date?: string;
  meta?: { TransactionResult?: string; delivered_amount?: string | { value: string; currency: string } | "unavailable" };
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
    metadata?: Record<string, unknown>;
  }): Promise<PaymentSession> {
    if (!PLATFORM_XRPL_ADDRESS || PLATFORM_XRPL_ADDRESS.includes("YourXrpl") || PLATFORM_XRPL_ADDRESS.includes("rYour") || PLATFORM_XRPL_ADDRESS.length < 25) {
      throw new Error("PLATFORM_XRPL_ADDRESS is not configured");
    }
    if (params.currency.toUpperCase() !== "XRP" || !Number.isFinite(params.amount) || params.amount <= 0) {
      throw new Error("XRP payment amount or currency is invalid");
    }
    const seed = String(params.metadata?.paymentId || params.orderId || params.subscriptionId || `${params.userId}-${Date.now()}`);
    const destinationTag = randomInt(1, 0xffffffff);
    const sessionId = `xrp_${seed}`;
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
      metadata: { orderId: params.orderId, planId: params.subscriptionId, userId: params.userId, ...params.metadata },
    };
  }

  async verifyPayment(params: { paymentId: string; externalId?: string; expectedAmount?: number; expectedTag?: number }): Promise<PaymentVerificationResult> {
    if (!params.externalId) return { status: "pending", verifiedAt: new Date(), raw: { message: "Provide txHash" } };
    if (!hasValidXrpExpectation(params.expectedAmount, params.expectedTag)) {
      return { status: "failed", externalId: params.externalId, verifiedAt: new Date(), raw: { error: "Expected amount and destination tag are required" } };
    }
    if (!isValidXrpTransactionHash(params.externalId)) {
      return { status: "failed", externalId: params.externalId, verifiedAt: new Date(), raw: { error: "Invalid XRPL transaction hash" } };
    }
    try {
      return await this.verifyByTxHash(params.externalId, params.expectedAmount!, params.expectedTag!);
    } catch (error: unknown) {
      return { status: "failed", externalId: params.externalId, verifiedAt: new Date(), raw: { error: error instanceof Error ? error.message : "XRPL verification failed" } };
    }
  }

  private async verifyByTxHash(txHash: string, expectedAmount: number, expectedTag: number): Promise<PaymentVerificationResult> {
    const response = await fetch(`${XRPSCAN_API}/tx/${encodeURIComponent(txHash)}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { status: "pending", externalId: txHash, verifiedAt: new Date(), raw: { error: `XRPSCAN returned ${response.status}` } };
    const tx = await response.json() as XrpscanTransaction;
    const fail = (reason: string) => ({ status: "failed" as const, externalId: txHash, verifiedAt: new Date(), raw: { reason, tx } });
    if (tx.TransactionType !== "Payment") return fail("Transaction is not a Payment");
    if (tx.meta?.TransactionResult !== "tesSUCCESS") return fail("Transaction did not succeed");
    if (tx.Destination !== PLATFORM_XRPL_ADDRESS) return fail("Wrong destination address");
    if (tx.DestinationTag !== expectedTag) return fail("Destination Tag mismatch");

    const delivered = tx.meta?.delivered_amount;
    const amountValue = delivered && delivered !== "unavailable" ? delivered : tx.Amount;
    if (typeof amountValue !== "string") return fail("Only native XRP payments are accepted");
    const amountReceived = Number(amountValue) / 1_000_000;
    if (!paymentAmountsMatch(expectedAmount, amountReceived, "XRP")) return fail("Amount mismatch");
    return { status: "completed", externalId: txHash, amountReceived, currency: "XRP", verifiedAt: new Date(), raw: tx };
  }

}

export const xrpProvider = new XrpPaymentProvider();
