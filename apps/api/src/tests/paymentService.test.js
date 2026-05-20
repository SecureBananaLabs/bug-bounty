import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, createStripePaymentIntentSmokeTest } from "../services/paymentService.js";

function createStripeMock({ response, error } = {}) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        async create(params) {
          calls.push(params);
          if (error) {
            throw error;
          }
          return response ?? {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_abc"
          };
        }
      }
    }
  };
}

test("createPaymentIntent validates payload and maps Stripe response", async () => {
  const stripe = createStripeMock();

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: {
      jobId: "job_123"
    }
  }, stripe.client);

  assert.deepEqual(stripe.calls, [{
    amount: 2500,
    currency: "usd",
    metadata: {
      jobId: "job_123"
    }
  }]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripe = createStripeMock();

  await createPaymentIntent({ amount: 100 }, stripe.client);

  assert.deepEqual(stripe.calls, [{
    amount: 100,
    currency: "usd"
  }]);
});

test("createPaymentIntent rejects invalid amount before calling Stripe", async () => {
  const stripe = createStripeMock();

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripe.client),
    /positive integer/
  );

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Your card was declined");
  stripeError.type = "StripeCardError";
  const stripe = createStripeMock({ error: stripeError });

  await assert.rejects(
    () => createPaymentIntent({ amount: 500 }, stripe.client),
    /Your card was declined/
  );
});

test("live Stripe smoke creates a test-mode payment intent when explicitly enabled", {
  skip: process.env.RUN_STRIPE_SMOKE !== "true" || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createStripePaymentIntentSmokeTest();

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_.*_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
