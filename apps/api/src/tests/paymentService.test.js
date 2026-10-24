import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import {
  createPaymentIntent,
  __setStripeFactoryForTests,
  __resetStripeFactoryForTests
} from "../services/paymentService.js";

test("createPaymentIntent validates positive integer amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /payload\.amount is required and must be a positive integer/
  );
});

test("createPaymentIntent defaults currency to usd and maps Stripe fields", async () => {
  const previousKey = env.stripeSecretKey;
  env.stripeSecretKey = "sk_test_123";

  const observed = {};

  __setStripeFactoryForTests((secretKey) => {
    observed.secretKey = secretKey;
    return {
      paymentIntents: {
        create: async (payload) => {
          observed.payload = payload;
          return {
            id: "pi_123",
            client_secret: "cs_test_123",
            amount: payload.amount,
            currency: payload.currency
          };
        }
      }
    };
  });

  try {
    const result = await createPaymentIntent({ amount: 1500 });

    assert.equal(observed.secretKey, "sk_test_123");
    assert.deepEqual(observed.payload, { amount: 1500, currency: "usd" });
    assert.equal(result.paymentId, "pi_123");
    assert.equal(result.clientSecret, "cs_test_123");
    assert.equal(result.provider, "stripe");
    assert.equal(result.currency, "usd");
    assert.equal(result.amount, 1500);
  } finally {
    __resetStripeFactoryForTests();
    env.stripeSecretKey = previousKey;
  }
});

test("createPaymentIntent preserves Stripe error message", async () => {
  const previousKey = env.stripeSecretKey;
  env.stripeSecretKey = "sk_test_123";

  __setStripeFactoryForTests(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined");
        error.name = "StripeCardError";
        throw error;
      }
    }
  }));

  try {
    await assert.rejects(
      () => createPaymentIntent({ amount: 2000, currency: "USD" }),
      (error) => {
        assert.equal(error.name, "StripeCardError");
        assert.match(error.message, /declined/i);
        return true;
      }
    );
  } finally {
    __resetStripeFactoryForTests();
    env.stripeSecretKey = previousKey;
  }
});

test("createPaymentIntent smoke test against Stripe API (guarded)", { skip: process.env.STRIPE_SMOKE_TEST !== "1" }, async () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  assert.ok(stripeKey, "STRIPE_SECRET_KEY is required when STRIPE_SMOKE_TEST=1");

  const previousKey = env.stripeSecretKey;
  env.stripeSecretKey = stripeKey;

  try {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "bounty-bot-smoke" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.currency, "usd");
    assert.equal(result.amount, 100);
  } finally {
    env.stripeSecretKey = previousKey;
  }
});
