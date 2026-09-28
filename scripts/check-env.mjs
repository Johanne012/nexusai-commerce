const strict = process.env.FORCE_STRICT_ENV === "1" || process.env.NODE_ENV === "production";
const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
const missing = required.filter((key) => !process.env[key]?.trim());
const errors = [...missing];

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://") && !process.env.DATABASE_URL.startsWith("postgres://")) {
  errors.push("DATABASE_URL must be a PostgreSQL URL");
}
if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
  errors.push("NEXTAUTH_SECRET must contain at least 32 characters");
}

const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
const hasXrp = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(process.env.PLATFORM_XRPL_ADDRESS || "") && !(process.env.PLATFORM_XRPL_ADDRESS || "").includes("YourXrpl");
const xrpRate = Number(process.env.XRP_USD_RATE || "0.6");
if (!Number.isFinite(xrpRate) || xrpRate <= 0) errors.push("XRP_USD_RATE must be a positive number");
if (strict && !hasStripe && !hasXrp) {
  errors.push("Configure Stripe (secret + webhook secret) or a real PLATFORM_XRPL_ADDRESS before production");
}
if (strict && (process.env.PAYMENT_PROVIDER || "").toLowerCase() === "demo") {
  errors.push("PAYMENT_PROVIDER=demo is forbidden in production");
}

if (errors.length) {
  console.error("[env] FAIL:", errors.join("; "));
  process.exit(1);
}

console.log("[env] check passed (mode=" + (strict ? "strict" : "development") + ")");
