import test from "node:test";
import assert from "node:assert/strict";
import {
  __setStripeClientForTests,
  createPaymentIntent,
  validatePaymentIntentPayload
} from "../services/paymentService.js";

test("validates required positive integer amount", () => {
  assert.throws(
    () => validatePaymentIntentPayload({ amount: 0 }),
    /positive integer/
  );
  assert.throws(
    () => validatePaymentIntentPayload({ amount: 10.5 }),
    /positive integer/
  );
});

test("defaults currency to usd and normalizes provided currency", () => {
  assert.deepEqual(validatePaymentIntentPayload({ amount: 500 }), {
    amount: 500,
    currency: "usd",
    metadata: undefined
  });
  assert.equal(
    validatePaymentIntentPayload({ amount: 500, currency: "EUR" }).currency,
    "eur"
  );
});

test("creates Stripe payment intent and maps response fields", async () => {
  const calls = [];
  __setStripeClientForTests({
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc"
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: { jobId: "job_123" }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { jobId: "job_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("preserves Stripe error message", async () => {
  __setStripeClientForTests({
    paymentIntents: {
      async create() {
        throw new Error("Invalid API Key provided");
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    /Invalid API Key provided/
  );
});
