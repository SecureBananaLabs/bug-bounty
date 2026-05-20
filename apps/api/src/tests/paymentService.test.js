import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import {
  createPaymentIntent,
  resetStripeClientFactoryForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

const originalStripeSecretKey = env.stripeSecretKey;

afterEach(() => {
  env.stripeSecretKey = originalStripeSecretKey;
  resetStripeClientFactoryForTests();
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated defaults", async () => {
  env.stripeSecretKey = "sk_test_unit";
  const createCalls = [];

  setStripeClientFactoryForTests((secretKey) => {
    assert.equal(secretKey, "sk_test_unit");
    return {
      paymentIntents: {
        create: async (params) => {
          createCalls.push(params);
          return {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_abc",
            amount: params.amount,
            currency: params.currency
          };
        }
      }
    };
  });

  const actual = await createPaymentIntent({
    amount: 1500,
    metadata: {
      jobId: 42,
      source: "checkout"
    }
  });

  assert.deepEqual(createCalls, [
    {
      amount: 1500,
      currency: "usd",
      metadata: {
        jobId: "42",
        source: "checkout"
      }
    }
  ]);
  assert.deepEqual(actual, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 1500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  env.stripeSecretKey = "sk_test_unit";
  let called = false;
  setStripeClientFactoryForTests(() => {
    called = true;
    return {
      paymentIntents: {
        create: async () => ({})
      }
    };
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /positive integer/
  );
  assert.equal(called, false);
});

test("createPaymentIntent rejects invalid currencies before calling Stripe", async () => {
  env.stripeSecretKey = "sk_test_unit";
  let called = false;
  setStripeClientFactoryForTests(() => {
    called = true;
    return {
      paymentIntents: {
        create: async () => ({})
      }
    };
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollars" }),
    /three-letter ISO currency code/
  );
  assert.equal(called, false);
});

test("createPaymentIntent requires Stripe configuration", async () => {
  env.stripeSecretKey = "";

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    /STRIPE_SECRET_KEY is required/
  );
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  env.stripeSecretKey = "sk_test_unit";
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

  await assert.rejects(
    () => createPaymentIntent({ amount: 1200, currency: "USD" }),
    (error) => {
      assert.equal(error.message, "Your card was declined.");
      assert.equal(error.statusCode, 402);
      assert.equal(error.code, "StripeCardError");
      return true;
    }
  );
});

test(
  "createPaymentIntent can create a live Stripe test-mode PaymentIntent",
  { skip: process.env.STRIPE_PAYMENT_SMOKE !== "true" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    env.stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    const actual = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        smoke: "true"
      }
    });

    assert.match(actual.paymentId, /^pi_/);
    assert.match(actual.clientSecret, /^pi_.*_secret_/);
    assert.equal(actual.amount, 100);
    assert.equal(actual.currency, "usd");
  }
);
