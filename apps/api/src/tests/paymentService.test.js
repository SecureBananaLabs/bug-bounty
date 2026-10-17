import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientFactoryForTesting,
  setStripeClientFactoryForTesting
} from "../services/paymentService.js";

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  resetStripeClientFactoryForTesting();
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated defaults", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const calls = [];

  setStripeClientFactoryForTesting((secretKey) => {
    assert.equal(secretKey, "sk_test_mock");
    return {
      paymentIntents: {
        create: async (args) => {
          calls.push(args);
          return {
            id: "pi_mock_123",
            client_secret: "pi_mock_123_secret_456"
          };
        }
      }
    };
  });

  const result = await createPaymentIntent({ amount: 2500 });

  assert.deepEqual(calls, [{ amount: 2500, currency: "usd" }]);
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent forwards currency and string metadata", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  const calls = [];

  setStripeClientFactoryForTesting(() => ({
    paymentIntents: {
      create: async (args) => {
        calls.push(args);
        return {
          id: "pi_with_metadata",
          client_secret: "pi_with_metadata_secret"
        };
      }
    }
  }));

  await createPaymentIntent({
    amount: 1500,
    currency: "GBP",
    metadata: {
      jobId: "job_123",
      userId: "usr_456"
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 1500,
      currency: "gbp",
      metadata: {
        jobId: "job_123",
        userId: "usr_456"
      }
    }
  ]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  let called = false;

  setStripeClientFactoryForTesting(() => ({
    paymentIntents: {
      create: async () => {
        called = true;
      }
    }
  }));

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /Payment amount is required and must be a positive integer/
  );
  assert.equal(called, false);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  setStripeClientFactoryForTesting(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  }));

  await assert.rejects(() => createPaymentIntent({ amount: 2500 }), /Your card was declined/);
});

test("createPaymentIntent live Stripe smoke test", { skip: process.env.STRIPE_PAYMENT_SMOKE !== "true" }, async () => {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    throw new Error("STRIPE_PAYMENT_SMOKE requires a Stripe test-mode STRIPE_SECRET_KEY");
  }

  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "freelanceflow-smoke-test"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
});
