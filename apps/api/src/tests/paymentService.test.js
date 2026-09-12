import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";

// ---- Shared mutable test state ----
const stripeCreateCalls = [];
let stripeCreateImpl = null; // null = use default happy-path behaviour

// ---- Mock the Stripe SDK before importing the module under test ----
class MockStripe {
  constructor(secretKey) {
    this._secretKey = secretKey;
    this.paymentIntents = {
      create: async (params) => {
        stripeCreateCalls.push(params);

        // Allow per-test override (e.g. to throw)
        if (stripeCreateImpl) {
          return stripeCreateImpl(params);
        }

        // Default happy-path response
        return {
          id: "pi_mock_" + Date.now(),
          client_secret: "pi_mock_secret_" + Date.now(),
          amount: params.amount,
          currency: params.currency,
          status: "requires_payment_method",
        };
      },
    };
  }
}

mock.module("stripe", {
  defaultExport: MockStripe,
});

// Dynamic import *after* mock.module is registered
const { createPaymentIntent } = await import("../services/paymentService.js");

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

test("valid amount + currency → calls stripe.paymentIntents.create, returns clientSecret + paymentId", async () => {
  stripeCreateCalls.length = 0;
  stripeCreateImpl = null;

  const result = await createPaymentIntent({ amount: 5000, currency: "usd" }, "user_abc");

  assert.equal(result.clientSecret.startsWith("pi_mock_secret_"), true);
  assert.equal(result.paymentId.startsWith("pi_mock_"), true);
  assert.equal(result.amount, 5000);
  assert.equal(result.currency, "usd");
  assert.equal(result.status, "requires_payment_method");

  // Verify the SDK was called with correct arguments
  assert.equal(stripeCreateCalls.length, 1);
  assert.equal(stripeCreateCalls[0].amount, 5000);
  assert.equal(stripeCreateCalls[0].currency, "usd");
  assert.equal(stripeCreateCalls[0].metadata.jobId, "");
  assert.equal(stripeCreateCalls[0].metadata.userId, "user_abc");
  assert.deepEqual(stripeCreateCalls[0].automatic_payment_methods, { enabled: true });
});

test("amount is missing → throws error", async () => {
  stripeCreateCalls.length = 0;
  stripeCreateImpl = null;

  await assert.rejects(
    () => createPaymentIntent({ currency: "eur" }, "user_1"),
    /Invalid or missing amount/
  );
  assert.equal(stripeCreateCalls.length, 0); // SDK was NOT called
});

test("amount is negative / zero / non-integer / below minimum → throws error", async () => {
  stripeCreateCalls.length = 0;
  stripeCreateImpl = null;

  // Negative
  await assert.rejects(
    () => createPaymentIntent({ amount: -100 }, "user_1"),
    /Invalid or missing amount/
  );

  // Zero
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, "user_1"),
    /Invalid or missing amount/
  );

  // Non-integer (float)
  await assert.rejects(
    () => createPaymentIntent({ amount: 49.99 }, "user_1"),
    /Invalid or missing amount/
  );

  // Below minimum (49 < 50)
  await assert.rejects(
    () => createPaymentIntent({ amount: 49 }, "user_1"),
    /Invalid or missing amount/
  );

  assert.equal(stripeCreateCalls.length, 0); // SDK was NOT called
});

test("currency is missing → defaults to 'usd'", async () => {
  stripeCreateCalls.length = 0;
  stripeCreateImpl = null;

  const result = await createPaymentIntent({ amount: 1000 }, "user_2");

  assert.equal(result.currency, "usd");
  assert.equal(stripeCreateCalls.length, 1);
  assert.equal(stripeCreateCalls[0].currency, "usd");
});

test("Stripe API error → is caught and re-thrown", async () => {
  stripeCreateCalls.length = 0;

  // Override the default mock to simulate a Stripe API failure
  stripeCreateImpl = async () => {
    throw new Error("Stripe API error: card_declined");
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 5000, currency: "usd" }, "user_3"),
    /Stripe API error: card_declined/
  );

  assert.equal(stripeCreateCalls.length, 1); // SDK WAS called this time

  stripeCreateImpl = null; // reset
});
