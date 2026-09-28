import { NextResponse } from "next/server";

/** Order fulfillment is intentionally restricted to verified provider callbacks. */
export async function POST() {
  return NextResponse.json(
    { error: "Direct order completion is disabled. Verify payment through /api/payments/verify." },
    { status: 410 }
  );
}
