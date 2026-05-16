import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaymentIntent,
  PaymentValidationError,
  setStripeClientForTests
} from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe payment intent", async () => {
  const calls = [];

  setStripeClientForTests({
    paymentIntents: {
      async create(params) {
        calls.push(params);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456"
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
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

test("createPaymentIntent defaults currency to usd", async () => {
  const calls = [];

  setStripeClientForTests({
    paymentIntents: {
      async create(params) {
        calls.push(params);
        return {
          id: "pi_test_default",
          client_secret: "pi_test_default_secret"
        };
      }
    }
  });

  await createPaymentIntent({ amount: 1000 });

  assert.equal(calls[0].currency, "usd");
});

test("createPaymentIntent rejects invalid amounts", async () => {
  await assert.rejects(
    createPaymentIntent({ amount: 0 }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "amount must be a positive integer in the smallest currency unit"
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTests({
    paymentIntents: {
      async create() {
        throw new Error("Your card was declined.");
      }
    }
  });

  await assert.rejects(createPaymentIntent({ amount: 1000 }), /Your card was declined\./);
});
