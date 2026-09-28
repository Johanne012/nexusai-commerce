import type { PaymentProvider } from "./base";
import { xrpProvider } from "./xrp";
import { demoProvider } from "./demo";
import { stripeProvider, isStripeConfigured } from "./stripe";

export function isXrpConfigured(): boolean {
  const addr = (process.env.PLATFORM_XRPL_ADDRESS || "").trim();
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr) && !addr.includes("YourXrpl");
}

export function resolvePaymentProvider(preferred?: string): PaymentProvider {
  const name = (preferred || process.env.PAYMENT_PROVIDER || "").toLowerCase();
  if (name === "stripe") {
    if (!isStripeConfigured()) throw new Error("Stripe is not configured (secret key and webhook secret required)");
    return stripeProvider;
  }
  if (name === "xrp") {
    if (!isXrpConfigured()) throw new Error("XRP is not configured (PLATFORM_XRPL_ADDRESS)");
    return xrpProvider;
  }
  if (name === "demo") {
    if (process.env.NODE_ENV === "production") throw new Error("Demo payments are disabled in production");
    return demoProvider;
  }
  if (isStripeConfigured()) return stripeProvider;
  if (isXrpConfigured()) return xrpProvider;
  if (process.env.NODE_ENV !== "production") return demoProvider;
  throw new Error("No real payment provider is configured");
}

export function getPaymentProvider(name = "auto"): PaymentProvider { return resolvePaymentProvider(name); }

export function listAvailableProviders(): { id: string; available: boolean; label: string }[] {
  return [
    { id: "stripe", available: isStripeConfigured(), label: "Stripe (بطاقة)" },
    { id: "xrp", available: isXrpConfigured(), label: "XRP (XRPL)" },
    { id: "demo", available: process.env.NODE_ENV !== "production", label: "تجريبي محلي (للتطوير فقط)" },
  ];
}

export * from "./base";
export * from "./xrp";
export * from "./demo";
export * from "./stripe";
