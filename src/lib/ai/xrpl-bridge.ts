/**
 * XRPL × AI Integration Bridge
 * AI generates product → priced in XRP → Destination Tag payment or Escrow for high value
 * Ready for agentic patterns (destination-tag matching, escrow, future x402/MPP)
 */

import { generateProduct, type GenerationRequest, type GenerationResult } from "./generator";
import { getPaymentProvider } from "@/lib/payments";
import {
  buildEscrowCreateParams,
  generateConditionPlaceholder,
  xrpToDrops,
} from "@/lib/escrow/xrpl-escrow";

export interface AiProductOffer {
  product: GenerationResult;
  priceXrp: number;
  paymentSession?: Awaited<ReturnType<ReturnType<typeof getPaymentProvider>["createPayment"]>>;
  escrowHint?: {
    amountDrops: string;
    conditionPlaceholder: string;
    suggestedFinishAfterHours: number;
    suggestedCancelAfterHours: number;
  };
  agentMetadata: {
    protocolHint: "destination-tag" | "escrow" | "x402-ready";
    productType: string;
    qualityTier: string;
    language: string;
  };
}

export async function generateAndPriceForXrpl(
  req: GenerationRequest,
  opts?: {
    userId?: string;
    useEscrow?: boolean;
    createPaymentSession?: boolean;
  }
): Promise<AiProductOffer> {
  const product = await generateProduct(req);
  const priceXrp = product.estimatedValueXrp;
  const useEscrow = opts?.useEscrow ?? priceXrp >= 20;

  const agentMetadata: AiProductOffer["agentMetadata"] = {
    protocolHint: useEscrow ? "escrow" : "destination-tag",
    productType: req.productType,
    qualityTier: req.qualityTier,
    language: req.language,
  };

  let paymentSession: AiProductOffer["paymentSession"];
  if (opts?.createPaymentSession && opts.userId) {
    try {
      const provider = getPaymentProvider("xrp");
      paymentSession = await provider.createPayment({
        amount: priceXrp,
        currency: "XRP",
        userId: opts.userId,
        metadata: {
          aiGenerated: true,
          title: product.title,
          productType: req.productType,
          qualityTier: req.qualityTier,
          tags: product.tags,
        },
      });
    } catch {
      paymentSession = undefined;
    }
  }

  let escrowHint: AiProductOffer["escrowHint"];
  if (useEscrow) {
    const seed = `${req.productType}:${req.topic}:${Date.now()}`;
    escrowHint = {
      amountDrops: xrpToDrops(priceXrp),
      conditionPlaceholder: generateConditionPlaceholder(seed),
      suggestedFinishAfterHours: 72,
      suggestedCancelAfterHours: 168,
    };
  }

  return { product, priceXrp, paymentSession, escrowHint, agentMetadata };
}

export function buildAiEscrowParams(opts: {
  platformAccount: string;
  providerAccount: string;
  amountXrp: number;
  jobId: string;
}) {
  return buildEscrowCreateParams({
    account: opts.platformAccount,
    destination: opts.providerAccount,
    amountXrp: opts.amountXrp,
    finishAfterHours: 72,
    cancelAfterHours: 168,
    condition: generateConditionPlaceholder(opts.jobId),
  });
}
