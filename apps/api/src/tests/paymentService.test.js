import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

test("createPaymentIntent creates a Stripe PaymentIntent with normalized input", async () => {
  let request;
  const stripeClient = {
    paymentIntents: {
      async create(payload) {
        request = payload;
        return {
          id: "pi_test_123",
          client_secret: "pi_test_secret_123",
          amount: payload.amount,
          currency: payload.currency,
          status: "requires_payment_method"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: { jobId: 42, source: "checkout" }
    },
    { stripeClient }
  );

  assert.deepEqual(request, {
    amount: 2500,
    currency: "usd",
    metadata: { jobId: "42", source: "checkout" },
    automatic_payment_methods: { enabled: true }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_secret_123",
    amount: 2500,
    currency: "usd",
    status: "requires_payment_method",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amounts before calling Stripe", async () => {
  let called = false;
  const stripeClient = {
    paymentIntents: {
      async create() {
        called = true;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.statusCode === 400 &&
      error.message === "amount must be a positive integer in the smallest currency unit"
  );
  assert.equal(called, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined");
        error.statusCode = 402;
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1500 }, { stripeClient }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.statusCode === 402 &&
      error.message === "Your card was declined"
  );
});
