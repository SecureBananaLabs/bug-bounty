import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPaymentIntentParams,
  createPaymentIntent,
  createStripeClient,
  PaymentProviderError,
  PaymentValidationError
} from "../services/paymentService.js";

test("buildPaymentIntentParams validates amount and defaults currency", () => {
  assert.deepEqual(buildPaymentIntentParams({ amount: 2500 }), {
    amount: 2500,
    currency: "usd"
  });

  assert.throws(
    () => buildPaymentIntentParams({ amount: 0 }),
    /amount is required and must be a positive integer/
  );
  assert.throws(
    () => buildPaymentIntentParams({ amount: 12.5 }),
    /amount is required and must be a positive integer/
  );
});

test("buildPaymentIntentParams normalizes currency and metadata", () => {
  assert.deepEqual(
    buildPaymentIntentParams({
      amount: 1099,
      currency: "EUR",
      metadata: {
        jobId: "job_123",
        escrow: true,
        milestone: 2
      }
    }),
    {
      amount: 1099,
      currency: "eur",
      metadata: {
        jobId: "job_123",
        escrow: "true",
        milestone: "2"
      }
    }
  );

  assert.throws(
    () => buildPaymentIntentParams({ amount: 1099, currency: "EURO" }),
    /currency must be a three-letter ISO currency code/
  );
  assert.throws(
    () => buildPaymentIntentParams({ amount: 1099, metadata: { nested: {} } }),
    /metadata values must be strings, numbers, or booleans/
  );
});

test("createPaymentIntent calls Stripe with validated params and maps response", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  };

  const result = await createPaymentIntent(
    { amount: 1999, currency: "USD", metadata: { invoiceId: "inv_1" } },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 1999,
      currency: "usd",
      metadata: { invoiceId: "inv_1" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 1999,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) => {
      assert.ok(error instanceof PaymentProviderError);
      assert.equal(error.statusCode, 502);
      assert.match(error.message, /Your card was declined\./);
      return true;
    }
  );
});

test("createStripeClient requires STRIPE_SECRET_KEY", () => {
  assert.throws(() => createStripeClient(""), {
    name: "PaymentProviderError",
    message: "STRIPE_SECRET_KEY is required to create payment intents"
  });
});

test(
  "createPaymentIntent creates a live Stripe test PaymentIntent when enabled",
  {
    skip:
      process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY
        ? "Set RUN_STRIPE_SMOKE=1 and STRIPE_SECRET_KEY to run the live Stripe smoke test"
        : false
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "securebanana-smoke-test" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /_secret_/);
  }
);

test("createPaymentIntent rethrows validation errors without calling Stripe", async () => {
  let called = false;
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        called = true;
      }
    }
  };

  await assert.rejects(
    createPaymentIntent({ amount: -1 }, { stripeClient }),
    PaymentValidationError
  );
  assert.equal(called, false);
});
