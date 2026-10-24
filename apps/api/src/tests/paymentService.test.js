import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  resetStripeClientForTests();
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated payload", async () => {
  const calls = [];
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests((secretKey) => {
    assert.equal(secretKey, "sk_test_mock");

    return {
      paymentIntents: {
        create: async (params) => {
          calls.push(params);
          return {
            id: "pi_mock_123",
            client_secret: "pi_mock_123_secret_456"
          };
        }
      }
    };
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: {
      jobId: 42,
      urgent: true
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "42",
        urgent: "true"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async (params) => {
        calls.push(params);
        return {
          id: "pi_default_currency",
          client_secret: "pi_default_currency_secret"
        };
      }
    }
  }));

  await createPaymentIntent({ amount: 1 });

  assert.deepEqual(calls, [{ amount: 1, currency: "usd" }]);
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  let called = false;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async () => {
        called = true;
      }
    }
  }));

  await assert.rejects(
    createPaymentIntent({ amount: 10.5 }),
    /positive integer/
  );
  assert.equal(called, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  }));

  await assert.rejects(
    createPaymentIntent({ amount: 500 }),
    (error) => error.name === "PaymentProviderError" && error.message === "Your card was declined."
  );
});

test("createPaymentIntent requires STRIPE_SECRET_KEY", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 500 }),
    /STRIPE_SECRET_KEY is required/
  );
});
