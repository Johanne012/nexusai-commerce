import { NextResponse } from "next/server";

/** Legacy anonymous endpoint disabled; create authenticated payment intents via /api/payments/create. */
export async function POST() {
  return NextResponse.json({ error: "Use the authenticated /api/payments/create endpoint." }, { status: 410 });
}
