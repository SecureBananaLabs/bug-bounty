import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  resetPaymentServiceForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  resetPaymentServiceForTests();
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated fields", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  let capturedSecretKey;
  let capturedParams;

  setStripeClientFactoryForTests((secretKey) => {
    capturedSecretKey = secretKey;
    return {
      paymentIntents: {
        create: async (params) => {
          capturedParams = params;
          return {
            id: "pi_mock_123",
            client_secret: "pi_mock_123_secret_abc",
            amount: params.amount,
            currency: params.currency
          };
        }
      }
    };
  });

  const result = await createPaymentIntent({
    amount: 1200,
    currency: " USD ",
    metadata: {
      jobId: "job_42",
      retry: false,
      attempt: 2,
      ignored: null
    }
  });

  assert.equal(capturedSecretKey, "sk_test_mock");
  assert.deepEqual(capturedParams, {
    amount: 1200,
    currency: "usd",
    metadata: {
      jobId: "job_42",
      retry: "false",
      attempt: "2"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_mock_123",
    clientSecret: "pi_mock_123_secret_abc",
    amount: 1200,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amount and currency before calling Stripe", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  let called = false;
  setStripeClientFactoryForTests(() => {
    called = true;
    return { paymentIntents: { create: async () => ({}) } };
  });

  await assert.rejects(
    createPaymentIntent({ amount: 0, currency: "usd" }),
    /amount must be a positive integer/
  );
  await assert.rejects(
    createPaymentIntent({ amount: 100, currency: "usdollars" }),
    /currency must be a three-letter ISO currency code/
  );
  assert.equal(called, false);
});

test("createPaymentIntent requires STRIPE_SECRET_KEY", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 100, currency: "usd" }),
    /STRIPE_SECRET_KEY is required/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        error.statusCode = 402;
        throw error;
      }
    }
  }));

  try {
    await createPaymentIntent({ amount: 100, currency: "usd" });
    assert.fail("Expected createPaymentIntent to throw");
  } catch (error) {
    assert.equal(error.message, "Your card was declined.");
    assert.equal(error.name, "StripeCardError");
    assert.equal(error.status, 402);
  }
});

test("createPaymentIntent can run a real Stripe smoke test when enabled", {
  skip: !process.env.RUN_STRIPE_SMOKE_TEST || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createPaymentIntent({
    amount: 50,
    currency: "usd",
    metadata: { source: "api-smoke-test" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 50);
  assert.equal(result.currency, "usd");
});
