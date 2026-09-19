import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, txHash, expectedAmount, expectedTag } = body;

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json({ error: "txHash is required" }, { status: 400 });
    }

    const provider = getPaymentProvider("xrp");
    const result = await provider.verifyPayment({
      paymentId: paymentId || "manual",
      externalId: txHash,
      expectedAmount: expectedAmount != null ? Number(expectedAmount) : undefined,
      expectedTag: expectedTag != null ? Number(expectedTag) : undefined,
    });

    return NextResponse.json({
      success: result.status === "completed",
      verification: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    console.error("Verify XRP payment error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
