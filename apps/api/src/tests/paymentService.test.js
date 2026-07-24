import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientForTest,
  setStripeClientForTest
} from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeClientForTest();
});

test("createPaymentIntent validates positive integer amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /amount is required and must be a positive integer/
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 12.5 }),
    /amount is required and must be a positive integer/
  );
});

test("createPaymentIntent validates currency values", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 2500, currency: 123 }),
    /currency must be a valid three-letter currency code/
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500, currency: "usdollar" }),
    /currency must be a valid three-letter currency code/
  );
});

test("createPaymentIntent creates a Stripe payment intent with default currency", async () => {
  const calls = [];
  setStripeClientForTest({
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc"
        };
      }
    }
  });

  const result = await createPaymentIntent({ amount: 2500 });

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent normalizes currency and metadata before calling Stripe", async () => {
  const calls = [];
  setStripeClientForTest({
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_456",
          client_secret: "pi_test_456_secret_def"
        };
      }
    }
  });

  await createPaymentIntent({
    amount: 5000,
    currency: "EUR",
    metadata: {
      jobId: 42,
      urgent: true,
      source: "checkout"
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 5000,
      currency: "eur",
      metadata: {
        jobId: "42",
        urgent: "true",
        source: "checkout"
      }
    }
  ]);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTest({
    paymentIntents: {
      create: async () => {
        const error = new Error("No such customer: cus_missing");
        error.type = "StripeInvalidRequestError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 5000 }),
    /No such customer: cus_missing/
  );
});

test("createPaymentIntent live Stripe smoke test", { skip: shouldSkipStripeSmoke() }, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      smoke: "true"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
});

function shouldSkipStripeSmoke() {
  if (process.env.STRIPE_PAYMENT_SMOKE !== "true") {
    return "set STRIPE_PAYMENT_SMOKE=true to run the live Stripe smoke test";
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return "set STRIPE_SECRET_KEY to run the live Stripe smoke test";
  }

  return false;
}
