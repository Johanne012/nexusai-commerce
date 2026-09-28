/**
 * NexusAI Commerce — Advanced Dynamic Pricing Engine
 * Continuous mathematical model (log / sigmoid / exponential decay)
 * Used by: generator, products UI, /api/pricing, payments path
 */

export type ProductType =
  | "ebook"
  | "marketing_copy"
  | "code_snippet"
  | "product_desc"
  | "report"
  | "service_package"
  | "prompt_pack"
  | "api_template"
  | string;

export type QualityTier =
  | "basic"
  | "standard"
  | "premium"
  | "enterprise"
  | string;

export interface PricingInput {
  productType: ProductType;
  qualityTier: QualityTier;
  /** Listed / generated base price in XRP */
  basePriceXrp: number;
  viewCount?: number;
  downloadCount?: number;
  /** Competing active products of same type */
  catalogCountSameType?: number;
  /** Hours since product creation */
  ageHours?: number;
  /** Optional promo multiplier (0.7–1.6) */
  campaignMultiplier?: number;
  minXrp?: number;
  maxXrp?: number;
}

export interface PricingResult {
  priceXrp: number;
  basePriceXrp: number;
  factors: {
    typeWeight: number;
    tierWeight: number;
    demand: number;
    scarcity: number;
    freshness: number;
    campaign: number;
    combined: number;
  };
  label: "normal" | "hot" | "discount" | "premium";
  explanationAr: string;
  explanationEn: string;
}

// ─── Base commercial weights ───────────────────────────────────────────────

const TYPE_WEIGHT: Record<string, number> = {
  ebook: 1.0,
  marketing_copy: 0.95,
  code_snippet: 1.06,
  product_desc: 0.9,
  report: 1.18,
  service_package: 1.28,
  prompt_pack: 1.02,
  api_template: 1.12,
};

const TIER_WEIGHT: Record<string, number> = {
  basic: 0.88,
  standard: 1.0,
  premium: 1.28,
  enterprise: 1.58,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function log10(n: number): number {
  return Math.log(n) / Math.LN10;
}

// ─── Continuous factor models ──────────────────────────────────────────────

/**
 * Demand (log-based, diminishing returns)
 * views & downloads increase willingness-to-pay without linear explosion.
 * demand ∈ [0.92, 1.40]
 */
export function demandFactor(views = 0, downloads = 0): number {
  const v = Math.max(0, views);
  const d = Math.max(0, downloads);
  // Weighted log interest score
  const score = 0.55 * log10(1 + v) + 0.9 * log10(1 + d * 3);
  // Map score → multiplier with soft ceiling
  const raw = 1 + 0.11 * score;
  return clamp(raw, 0.92, 1.4);
}

/**
 * Scarcity (logarithmic inverse supply)
 * Fewer competitors → higher price; many → competitive pressure.
 *
 * scarcity = 1.12 - 0.085 * log10(1 + k * count)
 * then clamped to [0.88, 1.15]
 *
 * count=0  → ~1.12
 * count=1  → ~1.09
 * count=5  → ~1.02
 * count=15 → ~0.96
 * count=40 → ~0.90
 */
export function scarcityFactor(sameTypeCount = 5): number {
  const n = Math.max(0, sameTypeCount);
  const raw = 1.12 - 0.085 * log10(1 + 1.8 * n);
  return clamp(raw, 0.88, 1.15);
}

/**
 * Freshness (exponential decay toward equilibrium)
 * Launch premium that decays; old products slightly discounted unless demand lifts them.
 *
 * f(t) = 0.94 + 0.14 * e^(-t / τ)
 * τ ≈ 120 hours (~5 days half-ish life for the premium component)
 * freshness ∈ [0.94, 1.08]
 */
export function freshnessFactor(ageHours = 48): number {
  const t = Math.max(0, ageHours);
  const tau = 120; // hours
  const raw = 0.94 + 0.14 * Math.exp(-t / tau);
  return clamp(raw, 0.94, 1.08);
}

/**
 * Campaign / promo (hard bounds for safety)
 */
export function campaignFactor(m = 1): number {
  return clamp(m, 0.7, 1.6);
}

// ─── Core engine ───────────────────────────────────────────────────────────

export function computeDynamicPrice(input: PricingInput): PricingResult {
  const base = Math.max(0.1, Number(input.basePriceXrp) || 1);

  const typeWeight = TYPE_WEIGHT[input.productType] ?? 1;
  const tierWeight = TIER_WEIGHT[input.qualityTier] ?? 1;

  const demand = demandFactor(input.viewCount ?? 0, input.downloadCount ?? 0);
  const scarcity = scarcityFactor(input.catalogCountSameType ?? 5);
  const freshness = freshnessFactor(input.ageHours ?? 48);
  const campaign = campaignFactor(input.campaignMultiplier ?? 1);

  // Multiplicative model (standard revenue-management style)
  const combined = typeWeight * tierWeight * demand * scarcity * freshness * campaign;

  let price = base * combined;

  const min = input.minXrp ?? Math.max(0.5, base * 0.65);
  const max = input.maxXrp ?? base * 2.8;
  price = clamp(price, min, max);
  price = Math.round(price * 100) / 100;

  const ratio = price / base;
  let label: PricingResult["label"] = "normal";
  if (ratio >= 1.18) label = "premium";
  else if (ratio >= 1.06) label = "hot";
  else if (ratio <= 0.9) label = "discount";

  const explanationAr =
    label === "premium"
      ? "سعر مرتفع: طلب قوي و/أو ندرة و/أو جودة عالية"
      : label === "hot"
        ? "طلب صاعد — السعر يتكيّف ديناميكياً للأعلى"
        : label === "discount"
          ? "ضغط تنافسي أو عرض قديم — تخفيض ديناميكي"
          : "سعر متوازن حسب العرض والطلب والجودة";

  const explanationEn =
    label === "premium"
      ? "Elevated by demand, scarcity, and/or tier"
      : label === "hot"
        ? "Rising demand — dynamic uplift"
        : label === "discount"
          ? "Competitive or aging supply — dynamic discount"
          : "Balanced market price";

  return {
    priceXrp: price,
    basePriceXrp: base,
    factors: {
      typeWeight,
      tierWeight,
      demand,
      scarcity,
      freshness,
      campaign,
      combined: Math.round(combined * 1000) / 1000,
    },
    label,
    explanationAr,
    explanationEn,
  };
}

/**
 * For brand-new AI-generated products (no history yet).
 * Builds a sensible base then applies dynamics with neutral demand/scarcity priors.
 */
export function priceForNewProduct(
  productType: string,
  qualityTier: string,
  topicLength: number,
  catalogCountSameType = 4
): number {
  const BASE: Record<string, number> = {
    ebook: 8,
    marketing_copy: 3.5,
    code_snippet: 6,
    product_desc: 2.5,
    report: 14,
    service_package: 18,
    prompt_pack: 5,
    api_template: 9,
  };

  // Topic complexity soft boost (log so long titles don't explode)
  const complexity = 1 + 0.12 * log10(1 + Math.max(0, topicLength));
  const base = (BASE[productType] ?? 5) * clamp(complexity, 0.95, 1.35);

  return computeDynamicPrice({
    productType,
    qualityTier,
    basePriceXrp: base,
    viewCount: 0,
    downloadCount: 0,
    catalogCountSameType,
    ageHours: 0,
  }).priceXrp;
}

/**
 * Re-price an existing DB product using live metrics.
 */
export function repriceProduct(params: {
  productType: string;
  qualityTier: string;
  listedPriceXrp: number;
  viewCount: number;
  downloadCount: number;
  sameTypeCount: number;
  createdAt: Date | string;
  campaignMultiplier?: number;
}): PricingResult {
  const created =
    typeof params.createdAt === "string"
      ? new Date(params.createdAt)
      : params.createdAt;
  const ageHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);

  return computeDynamicPrice({
    productType: params.productType,
    qualityTier: params.qualityTier,
    basePriceXrp: params.listedPriceXrp,
    viewCount: params.viewCount,
    downloadCount: params.downloadCount,
    catalogCountSameType: params.sameTypeCount,
    ageHours,
    campaignMultiplier: params.campaignMultiplier,
  });
}
