export function isValidXrpTransactionHash(hash: unknown): hash is string {
  return typeof hash === "string" && /^[a-fA-F0-9]{64}$/.test(hash);
}

export function hasValidXrpExpectation(amount: unknown, tag: unknown): amount is number {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0 &&
    typeof tag === "number" && Number.isInteger(tag) && tag >= 0 && tag <= 0xffffffff;
}

export function paymentAmountsMatch(expected: number, received: number, currency: string): boolean {
  if (!Number.isFinite(expected) || !Number.isFinite(received) || expected <= 0 || received <= 0) return false;
  return Math.abs(expected - received) <= (currency.toUpperCase() === "XRP" ? 0.000001 : 0.005);
}
