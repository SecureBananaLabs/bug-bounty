/**
 * Integration / smoke test for Stripe PaymentIntent creation.
 *
 * This test makes REAL API calls to Stripe in test mode.
 * It only runs when STRIPE_SMOKE_TEST=1 is set in the environment.
 *
 * Usage:
 *   STRIPE_SMOKE_TEST=1 STRIPE_SECRET_KEY=sk_test_... npm run test:smoke
 *
 * DO NOT commit a real secret key. Use a Stripe test-mode key only.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const SMOKE = process.env.STRIPE_SMOKE_TEST === "1";

describe("Stripe PaymentIntent smoke test", { skip: !SMOKE }, () => {
  it("creates a test-mode PaymentIntent and returns clientSecret", async () => {
    const { createPaymentIntent, PaymentError } = await import(
      "../services/paymentService.js"
    );

    const result = await createPaymentIntent({
      amount: 2000, // $20.00 in cents
      currency: "usd",
    });

    assert.equal(typeof result.paymentId, "string");
    assert.ok(result.paymentId.startsWith("pi_"), `Expected pi_ prefix, got ${result.paymentId}`);
    assert.equal(typeof result.clientSecret, "string");
    assert.ok(result.clientSecret.startsWith("cs_"), `Expected cs_ prefix, got ${result.clientSecret}`);
    assert.equal(result.amount, 2000);
    assert.equal(result.currency, "usd");
  });

  it("rejects missing amount", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await assert.rejects(
      () => createPaymentIntent({}),
      { message: "amount is required" }
    );
  });

  it("rejects non-positive amount", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await assert.rejects(
      () => createPaymentIntent({ amount: -5 }),
      { message: "amount must be a positive integer" }
    );
  });

  it("rejects non-integer amount", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      { message: "amount must be a positive integer" }
    );
  });

  it("defaults currency to usd", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    const result = await createPaymentIntent({ amount: 500 });
    assert.equal(result.currency, "usd");
  });
});