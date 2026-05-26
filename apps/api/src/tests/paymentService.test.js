import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, setStripeClientForTest } from "../services/paymentService.js";

afterEach(() => {
  setStripeClientForTest(undefined);
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated defaults", async () => {
  const calls = [];

  setStripeClientForTest({
    paymentIntents: {
      async create(params) {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: { orderId: "order_123" }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { orderId: "order_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  let createCalled = false;

  setStripeClientForTest({
    paymentIntents: {
      async create() {
        createCalled = true;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /payload\.amount must be a positive integer/
  );
  assert.equal(createCalled, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTest({
    paymentIntents: {
      async create() {
        const error = new Error("No such customer: cus_missing");
        error.type = "StripeInvalidRequestError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "USD" }),
    /Stripe payment intent creation failed: No such customer: cus_missing/
  );
});

test(
  "createPaymentIntent smoke test creates a real Stripe test-mode PaymentIntent",
  { skip: process.env.RUN_STRIPE_SMOKE_TESTS !== "1" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    setStripeClientForTest(undefined);

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smokeTest: "true" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
