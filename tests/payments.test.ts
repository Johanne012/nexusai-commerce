import test from "node:test";
import assert from "node:assert/strict";
import { hasValidXrpExpectation, isValidXrpTransactionHash, paymentAmountsMatch } from "../src/lib/payments/amount";

test("XRPL tx hashes must be exactly 64 hexadecimal characters", () => {
  assert.equal(isValidXrpTransactionHash("a".repeat(64)), true);
  assert.equal(isValidXrpTransactionHash("../" + "a".repeat(64)), false);
  assert.equal(isValidXrpTransactionHash("a".repeat(63)), false);
  assert.equal(isValidXrpTransactionHash(null), false);
});

test("XRP verification fails closed without an amount and destination tag", () => {
  assert.equal(hasValidXrpExpectation(1.25, 100001), true);
  assert.equal(hasValidXrpExpectation(undefined, 100001), false);
  assert.equal(hasValidXrpExpectation(1.25, undefined), false);
  assert.equal(hasValidXrpExpectation(-1, 100001), false);
  assert.equal(hasValidXrpExpectation(1.25, 1.5), false);
});

test("payment matching rejects non-finite, zero, negative, and mismatched values", () => {
  assert.equal(paymentAmountsMatch(1, 1.000001, "XRP"), true);
  assert.equal(paymentAmountsMatch(1, 1.00001, "XRP"), false);
  assert.equal(paymentAmountsMatch(15, 15.004, "USD"), true);
  assert.equal(paymentAmountsMatch(15, 14.99, "USD"), false);
  assert.equal(paymentAmountsMatch(NaN, 1, "XRP"), false);
  assert.equal(paymentAmountsMatch(1, 0, "XRP"), false);
});
test("XRPL provider binds successful ledger payments to address, tag, and drops", async () => {
  const address = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH";
  const oldAddress = process.env.PLATFORM_XRPL_ADDRESS;
  const oldApi = process.env.XRPSCAN_API_URL;
  const oldFetch = globalThis.fetch;
  process.env.PLATFORM_XRPL_ADDRESS = address;
  process.env.XRPSCAN_API_URL = "https://unit.test/api/v1";
  globalThis.fetch = (async () => new Response(JSON.stringify({
    hash: "A".repeat(64),
    TransactionType: "Payment",
    Account: "rSourceAddress",
    Destination: address,
    DestinationTag: 123456,
    Amount: "1000000",
    ledger_index: 90000000,
    meta: { TransactionResult: "tesSUCCESS", delivered_amount: "1000000" },
  }), { status: 200 })) as typeof fetch;
  try {
    const { XrpPaymentProvider } = await import("../src/lib/payments/xrp");
    const provider = new XrpPaymentProvider();
    const accepted = await provider.verifyPayment({ paymentId: "p1", externalId: "A".repeat(64), expectedAmount: 1, expectedTag: 123456 });
    const wrongTag = await provider.verifyPayment({ paymentId: "p2", externalId: "B".repeat(64), expectedAmount: 1, expectedTag: 123457 });
    assert.equal(accepted.status, "completed");
    assert.equal(accepted.amountReceived, 1);
    assert.equal(wrongTag.status, "failed");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldAddress === undefined) delete process.env.PLATFORM_XRPL_ADDRESS; else process.env.PLATFORM_XRPL_ADDRESS = oldAddress;
    if (oldApi === undefined) delete process.env.XRPSCAN_API_URL; else process.env.XRPSCAN_API_URL = oldApi;
  }
});
