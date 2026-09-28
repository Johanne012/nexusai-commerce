import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env/validate";

export async function GET() {
  const runtime = validateEnv("runtime");
  const strict = validateEnv("strict");

  return NextResponse.json({
    status: runtime.ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    env: {
      runtime: {
        ok: runtime.ok,
        missing: runtime.missing,
        warnings: runtime.warnings,
      },
      strictProduction: {
        ok: strict.ok,
        missing: strict.missing,
      },
      info: runtime.info,
    },
    features: {
      xrpPayments: Boolean(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(process.env.PLATFORM_XRPL_ADDRESS || "")),
      stripePayments: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      aiGeneration: true,
      escrow: false,
      marketplaceJobs: true,
      auth: Boolean(process.env.NEXTAUTH_SECRET),
    },
  });
}
