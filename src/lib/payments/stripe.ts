import Stripe from "stripe";
import type { PaymentProvider, PaymentSession, PaymentVerificationResult, PaymentWebhookEvent } from "./base";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion }) : null;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async createPayment(params: {
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentSession> {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured");
    const currency = params.currency.toLowerCase();
    if (currency !== "usd") throw new Error("Stripe checkout is currently priced in USD only");
    if (!Number.isFinite(params.amount) || params.amount < 0.5 || params.amount > 99999.99) {
      throw new Error("Stripe amount must be between $0.50 and $99,999.99");
    }

    const baseUrl = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
    if (!baseUrl.startsWith("https://") && process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_URL must be HTTPS in production");
    }
    const isSubscription = Boolean(params.subscriptionId);
    const metadata: Record<string, string> = {
      userId: params.userId,
      orderId: params.orderId || "",
      planId: params.subscriptionId || "",
    };
    for (const [key, value] of Object.entries(params.metadata || {})) {
      if (value != null) metadata[key] = String(value);
    }

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(params.amount * 100),
          product_data: {
            name: params.orderId ? `Order ${params.orderId}` : `Subscription ${params.subscriptionId}`,
            description: isSubscription ? "NexusAI monthly subscription" : "NexusAI digital product",
          },
          ...(isSubscription ? { recurring: { interval: "month" as const } } : {}),
        },
      }],
      ...(isSubscription ? { subscription_data: { metadata } } : {}),
      success_url: `${baseUrl}/pay?status=success&session_id={CHECKOUT_SESSION_ID}&orderId=${encodeURIComponent(params.orderId || "")}&plan=${encodeURIComponent(params.subscriptionId || "")}`,
      cancel_url: `${baseUrl}/pay?status=cancel`,
      client_reference_id: params.userId,
      metadata,
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return {
      id: session.id,
      provider: this.name,
      amount: params.amount,
      currency: "USD",
      status: "pending",
      paymentUrl: session.url,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
      metadata: { stripeSessionId: session.id },
    };
  }

  async verifyPayment(params: { paymentId: string; externalId?: string }): Promise<PaymentVerificationResult> {
    const stripe = getStripe();
    if (!stripe) return { status: "failed", verifiedAt: new Date(), raw: { error: "Stripe is not configured" } };
    const sessionId = params.externalId || params.paymentId;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      let providerSubscriptionId: string | undefined;
      let periodStart: Date | undefined;
      let periodEnd: Date | undefined;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        providerSubscriptionId = subscription.id;
        periodStart = new Date(subscription.current_period_start * 1000);
        periodEnd = new Date(subscription.current_period_end * 1000);
      }
      return {
        status: "completed",
        externalId: session.id,
        amountReceived: session.amount_total == null ? undefined : session.amount_total / 100,
        currency: session.currency?.toUpperCase(),
        metadata: session.metadata as Record<string, string> | null ?? undefined,
        providerSubscriptionId,
        periodStart,
        periodEnd,
        verifiedAt: new Date(),
        raw: session,
      };
    }
    if (session.status === "expired") return { status: "expired", externalId: session.id, verifiedAt: new Date(), raw: session };
    return { status: "pending", externalId: session.id, verifiedAt: new Date(), raw: session };
  }

  async cancelAtPeriodEnd(subscriptionId: string): Promise<Date> {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured");
    const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    return new Date(subscription.current_period_end * 1000);
  }

  async handleWebhook(payload: string | Buffer, headers?: Record<string, string>): Promise<PaymentWebhookEvent> {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) throw new Error("Stripe webhook is not configured");
    const sig = headers?.["stripe-signature"] || headers?.["Stripe-Signature"] || "";
    const event = stripe.webhooks.constructEvent(payload, sig, secret);
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      const period = invoice.lines.data[0]?.period;
      return {
        eventId: event.id,
        type: event.type,
        paid: Boolean(subscriptionId && period),
        providerSubscriptionId: subscriptionId || undefined,
        periodStart: period ? new Date(period.start * 1000) : undefined,
        periodEnd: period ? new Date(period.end * 1000) : undefined,
      };
    }
    if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      return { eventId: event.id, type: event.type, paid: false };
    }
    const session = event.data.object as Stripe.Checkout.Session;
    return {
      eventId: event.id,
      type: event.type,
      sessionId: session.id,
      paid: session.payment_status === "paid",
      metadata: (session.metadata || {}) as Record<string, string>,
    };
  }
}

export const stripeProvider = new StripePaymentProvider();
