/**
 * Run: node scripts/check-env.mjs
 * Used by Vercel build and CI to validate environment.
 */

const mode = process.env.FORCE_STRICT_ENV === "1" ? "strict" : "build";

function present(key) {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

if (!present("DATABASE_URL")) {
  console.warn("[env] warn: DATABASE_URL not set — set file:./dev.db or Postgres URL on Vercel");
}
if (!present("NEXTAUTH_SECRET")) {
  console.warn("[env] warn: NEXTAUTH_SECRET not set — auth will fail at runtime");
}
if (!present("PLATFORM_XRPL_ADDRESS")) {
  console.warn("[env] warn: PLATFORM_XRPL_ADDRESS not set — XRP createPayment will error");
}

if (mode === "strict") {
  const missing = ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "DATABASE_URL", "PLATFORM_XRPL_ADDRESS"].filter(
    (k) => !present(k)
  );
  if (missing.length) {
    console.error("[env] FAIL strict:", missing.join(", "));
    process.exit(1);
  }
}

console.log("[env] check passed (mode=" + mode + ")");
process.exit(0);
