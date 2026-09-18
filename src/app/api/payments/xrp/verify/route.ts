import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, txHash, expectedAmount, expectedTag } = body;

    if (!txHash) {
      return NextResponse.json({ error: "txHash is required" }, { status: 400 });
    }

    const provider = getPaymentProvider("xrp");

    const result = await provider.verifyPayment({
      paymentId: paymentId || "manual",
      externalId: txHash,
      // @ts-ignore
      expectedAmount,
      expectedTag,
    });

    return NextResponse.json({
      success: result.status === "completed",
      verification: result,
    });
  } catch (error: any) {
    console.error("Verify XRP payment error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
