import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// ── Mock Stripe before importing service ──
const mockCreate = async ({ amount, currency }) => ({
  id: "pi_test_123",
  client_secret: "pi_test_123_secret_abc",
  amount,
  currency
});

// Patch dynamic import by setting env mock flag
process.env.STRIPE_MOCK = "true";
process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";

const { createPaymentIntent } = await import("../services/paymentService.js");

describe("createPaymentIntent", () => {
  it("returns paymentId and clientSecret for valid payload", async () => {
    const result = await createPaymentIntent({ amount: 1000, currency: "usd" });
    assert.equal(result.paymentId, "pi_test_mock");
    assert.ok(result.clientSecret, "clientSecret should be present");
    assert.equal(result.amount, 1000);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  });

  it("defaults currency to usd", async () => {
    const result = await createPaymentIntent({ amount: 500 });
    assert.equal(result.currency, "usd");
  });

  it("throws for missing amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({ currency: "usd" }),
      /positive integer/
    );
  });

  it("throws for zero amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      /positive integer/
    );
  });

  it("throws for negative amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: -50 }),
      /positive integer/
    );
  });

  it("throws for non-integer amount", async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 9.99 }),
      /positive integer/
    );
  });
});
