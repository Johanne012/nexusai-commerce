export type EnvMode = "build" | "runtime" | "strict";
export interface EnvCheckResult { ok: boolean; mode: EnvMode; missing: string[]; warnings: string[]; info: Record<string, string> }
const present = (key: string) => typeof process.env[key] === "string" && Boolean(process.env[key]!.trim());
const postgresUrl = () => /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || "");
const hasStripe = () => present("STRIPE_SECRET_KEY") && present("STRIPE_WEBHOOK_SECRET");
const hasXrp = () => present("PLATFORM_XRPL_ADDRESS") && (process.env.PLATFORM_XRPL_ADDRESS || "").length >= 25 && !(process.env.PLATFORM_XRPL_ADDRESS || "").includes("YourXrpl");

export function validateEnv(mode: EnvMode = "runtime"): EnvCheckResult {
  const missing: string[] = [];
  const required = mode === "build" ? ["DATABASE_URL"] : ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  for (const key of required) if (!present(key)) missing.push(key);
  if (present("DATABASE_URL") && !postgresUrl()) missing.push("DATABASE_URL must be PostgreSQL");
  if (mode === "strict" && !hasStripe() && !hasXrp()) missing.push("Configure Stripe (secret + webhook secret) or PLATFORM_XRPL_ADDRESS");
  if (present("NEXTAUTH_SECRET") && process.env.NEXTAUTH_SECRET!.length < 32) missing.push("NEXTAUTH_SECRET must be at least 32 characters");
  const warnings: string[] = [];
  if (!hasStripe() && !hasXrp()) warnings.push("No real payment provider configured; payments will be unavailable");
  const rate = Number(process.env.XRP_USD_RATE || "0.6");
  if (!Number.isFinite(rate) || rate <= 0) warnings.push("XRP_USD_RATE must be a positive number");
  return {
    ok: missing.length === 0,
    mode,
    missing,
    warnings,
    info: { NODE_ENV: process.env.NODE_ENV || "undefined", hasStripe: String(hasStripe()), hasXrp: String(hasXrp()), hasDb: String(postgresUrl()), hasAuthSecret: String(present("NEXTAUTH_SECRET")), hasAuthUrl: String(present("NEXTAUTH_URL")) },
  };
}

export function assertEnv(mode: EnvMode = "runtime"): void {
  const result = validateEnv(mode);
  if (!result.ok) throw new Error(`[env] Missing/invalid variables (${mode}): ${result.missing.join(", ")}`);
}
