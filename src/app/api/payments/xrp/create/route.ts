import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { validateEnv } from "@/lib/env/validate";

export async function POST(req: NextRequest) {
  try {
    const env = validateEnv("runtime");
    if (!process.env.PLATFORM_XRPL_ADDRESS) {
      return NextResponse.json(
        {
          error: "PLATFORM_XRPL_ADDRESS is not configured",
          hint: "Add PLATFORM_XRPL_ADDRESS in Vercel Environment Variables",
          envWarnings: env.warnings,
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { orderId, subscriptionId, amount, userId, metadata } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const provider = getPaymentProvider("xrp");
    const session = await provider.createPayment({
      orderId,
      subscriptionId,
      amount: Number(amount),
      currency: "XRP",
      userId,
      metadata,
    });

    return NextResponse.json({
      success: true,
      session,
      instructions: {
        ar: `أرسل ${session.amount} XRP إلى العنوان مع Destination Tag إلزامي`,
        en: `Send exactly ${session.amount} XRP. Destination Tag is mandatory.`,
        address: session.destinationAddress,
        destinationTag: session.destinationTag,
        amount: session.amount,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create payment";
    console.error("Create XRP payment error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
