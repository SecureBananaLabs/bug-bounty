import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import {
  createPaymentIntent,
  resetStripeClientFactoryForTest,
  setStripeClientFactoryForTest
} from "../services/paymentService.js";

const originalSecretKey = env.stripeSecretKey;

test.afterEach(() => {
  env.stripeSecretKey = originalSecretKey;
  resetStripeClientFactoryForTest();
});

test("createPaymentIntent validates payload and calls Stripe with expected arguments", async () => {
  env.stripeSecretKey = "sk_test_mock";
  let receivedSecretKey;
  let receivedCreatePayload;

  setStripeClientFactoryForTest((secretKey) => {
    receivedSecretKey = secretKey;
    return {
      paymentIntents: {
        create: async (payload) => {
          receivedCreatePayload = payload;
          return { id: "pi_123", client_secret: "pi_123_secret_456" };
        }
      }
    };
  });

  const result = await createPaymentIntent({ amount: 2500, currency: "EUR", metadata: { jobId: "job_101" } });

  assert.equal(receivedSecretKey, "sk_test_mock");
  assert.deepEqual(receivedCreatePayload, {
    amount: 2500,
    currency: "eur",
    metadata: { jobId: "job_101" }
  });
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_456",
    amount: 2500,
    currency: "eur",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  env.stripeSecretKey = "sk_test_mock";
  let receivedCreatePayload;

  setStripeClientFactoryForTest(() => ({
    paymentIntents: {
      create: async (payload) => {
        receivedCreatePayload = payload;
        return { id: "pi_default", client_secret: "secret_default" };
      }
    }
  }));

  await createPaymentIntent({ amount: 1000 });

  assert.equal(receivedCreatePayload.currency, "usd");
});

test("createPaymentIntent rejects invalid amount and missing Stripe key before provider calls", async () => {
  env.stripeSecretKey = "";
  let providerCalled = false;

  setStripeClientFactoryForTest(() => {
    providerCalled = true;
    return { paymentIntents: { create: async () => ({}) } };
  });

  await assert.rejects(() => createPaymentIntent({ amount: 0 }), /positive integer/);
  await assert.rejects(() => createPaymentIntent({ amount: 1000 }), /STRIPE_SECRET_KEY/);
  assert.equal(providerCalled, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  env.stripeSecretKey = "sk_test_mock";

  setStripeClientFactoryForTest(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  }));

  await assert.rejects(() => createPaymentIntent({ amount: 500 }), /Your card was declined\./);
});

test(
  "guarded live Stripe smoke test creates a test PaymentIntent",
  { skip: process.env.STRIPE_LIVE_SMOKE === "true" ? false : "set STRIPE_LIVE_SMOKE=true and STRIPE_SECRET_KEY to run" },
  async () => {
    env.stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
    const result = await createPaymentIntent({ amount: 100, currency: "usd", metadata: { smoke: "true" } });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
  }
);
