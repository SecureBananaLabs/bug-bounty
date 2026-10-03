import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

test("createPaymentIntent validates payload and calls Stripe paymentIntents.create", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      create: async (request) => {
        calls.push(request);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_456",
          amount: request.amount,
          currency: request.currency
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 2599,
      currency: "USD",
      metadata: {
        jobId: "job_123",
        milestone: 2,
        escrow: true
      }
    },
    stripeClient
  );

  assert.deepEqual(calls, [
    {
      amount: 2599,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        milestone: "2",
        escrow: "true"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_456",
    amount: 2599,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async (request) => ({
        id: "pi_default_currency",
        client_secret: "pi_default_currency_secret",
        amount: request.amount,
        currency: request.currency
      })
    }
  };

  const result = await createPaymentIntent({ amount: 1000 }, stripeClient);

  assert.equal(result.currency, "usd");
});

test("createPaymentIntent rejects invalid amount before calling Stripe", async () => {
  let called = false;
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        called = true;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripeClient),
    (error) =>
      error instanceof PaymentServiceError &&
      error.message === "amount must be a positive integer in the smallest currency unit" &&
      error.statusCode === 400
  );
  assert.equal(called, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        error.statusCode = 402;
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "usd" }, stripeClient),
    (error) =>
      error instanceof PaymentServiceError &&
      error.message === "Your card was declined." &&
      error.statusCode === 402
  );
});

test(
  "createPaymentIntent smoke creates a real Stripe test-mode PaymentIntent",
  { skip: process.env.RUN_STRIPE_SMOKE_TESTS !== "1" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        smokeTest: true,
        source: "api-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  }
);
