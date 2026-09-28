import { NextResponse } from "next/server";

/** Legacy endpoint disabled because it does not bind a transaction to an owned payment record. */
export async function POST() {
  return NextResponse.json({ error: "Use the authenticated /api/payments/verify endpoint." }, { status: 410 });
}
