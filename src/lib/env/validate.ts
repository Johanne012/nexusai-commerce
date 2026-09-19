/**
 * Environment validation for Vercel / local
 */

export type EnvMode = "build" | "runtime" | "strict";

export interface EnvCheckResult {
  ok: boolean;
  mode: EnvMode;
  missing: string[];
  warnings: string[];
  info: Record<string, string>;
}

const REQUIRED_RUNTIME = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const;
const REQUIRED_STRICT = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "DATABASE_URL",
  "PLATFORM_XRPL_ADDRESS",
] as const;
const REQUIRED_BUILD = ["DATABASE_URL"] as const;

function present(key: string): boolean {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

export function validateEnv(mode: EnvMode = "runtime"): EnvCheckResult {
  const list =
    mode === "build"
      ? REQUIRED_BUILD
      : mode === "strict"
        ? REQUIRED_STRICT
        : REQUIRED_RUNTIME;

  const missing: string[] = [];
  for (const key of list) {
    if (!present(key)) missing.push(key);
  }

  const warnings: string[] = [];
  if (!present("PLATFORM_XRPL_ADDRESS")) {
    warnings.push("PLATFORM_XRPL_ADDRESS missing — XRP payments will fail until set");
  }
  if (!present("DATABASE_URL")) {
    warnings.push("DATABASE_URL missing — set file:./dev.db or Postgres on Vercel");
  }
  if (present("NEXTAUTH_SECRET") && (process.env.NEXTAUTH_SECRET?.length || 0) < 16) {
    warnings.push("NEXTAUTH_SECRET should be at least 16 characters");
  }

  return {
    ok: missing.length === 0,
    mode,
    missing,
    warnings,
    info: {
      NODE_ENV: process.env.NODE_ENV || "undefined",
      hasXrpl: String(present("PLATFORM_XRPL_ADDRESS")),
      hasDb: String(present("DATABASE_URL")),
      hasAuthSecret: String(present("NEXTAUTH_SECRET")),
      hasAuthUrl: String(present("NEXTAUTH_URL")),
    },
  };
}

export function assertEnv(mode: EnvMode = "runtime"): void {
  const result = validateEnv(mode);
  if (!result.ok) {
    throw new Error(
      `[env] Missing required variables (${mode}): ${result.missing.join(", ")}. ` +
        `Set them in Vercel → Settings → Environment Variables.`
    );
  }
}
