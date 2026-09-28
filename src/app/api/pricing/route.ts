import { NextResponse } from "next/server";
import {
  computeDynamicPrice,
  demandFactor,
  scarcityFactor,
  freshnessFactor,
} from "@/lib/pricing/dynamic";

/**
 * POST /api/pricing — full dynamic quote
 * GET  /api/pricing?views=&downloads=&count=&ageHours= — factor preview
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const basePriceXrp = Number(body.basePriceXrp);
    if (!Number.isFinite(basePriceXrp) || basePriceXrp <= 0) {
      return NextResponse.json({ error: "basePriceXrp مطلوب" }, { status: 400 });
    }

    const result = computeDynamicPrice({
      productType: String(body.productType || "ebook"),
      qualityTier: String(body.qualityTier || "standard"),
      basePriceXrp,
      viewCount: Number(body.viewCount) || 0,
      downloadCount: Number(body.downloadCount) || 0,
      catalogCountSameType: Number(body.catalogCountSameType) || 5,
      ageHours: Number(body.ageHours) || 48,
      campaignMultiplier: body.campaignMultiplier
        ? Number(body.campaignMultiplier)
        : 1,
      minXrp: body.minXrp != null ? Number(body.minXrp) : undefined,
      maxXrp: body.maxXrp != null ? Number(body.maxXrp) : undefined,
    });

    return NextResponse.json({
      ...result,
      model: "log-scarcity + log-demand + exp-freshness",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل حساب السعر" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const views = Number(searchParams.get("views") || 0);
  const downloads = Number(searchParams.get("downloads") || 0);
  const count = Number(searchParams.get("count") || 5);
  const ageHours = Number(searchParams.get("ageHours") || 48);

  return NextResponse.json({
    demand: demandFactor(views, downloads),
    scarcity: scarcityFactor(count),
    freshness: freshnessFactor(ageHours),
    formulas: {
      scarcity: "1.12 - 0.085 * log10(1 + 1.8 * n)  ∈ [0.88, 1.15]",
      demand: "1 + 0.11 * (0.55*log10(1+v) + 0.9*log10(1+3d))  ∈ [0.92, 1.40]",
      freshness: "0.94 + 0.14 * exp(-t/120)  ∈ [0.94, 1.08]",
    },
  });
}
