import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, subscriptionId, amount, userId, metadata } = body;

    if (!amount || amount <= 0) {
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
        ar: `أرسل ${session.amount} XRP إلى العنوان التالي مع Destination Tag إلزامي`,
        en: `Send exactly ${session.amount} XRP to the address below. Destination Tag is mandatory.`,
        address: session.destinationAddress,
        destinationTag: session.destinationTag,
        amount: session.amount,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Create XRP payment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
