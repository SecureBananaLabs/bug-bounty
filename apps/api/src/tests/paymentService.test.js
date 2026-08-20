import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

function createMockStripeClient(handler) {
  return {
    paymentIntents: {
      create: handler
    }
  };
}

test("createPaymentIntent creates a Stripe payment intent with validated arguments", async () => {
  const calls = [];
  const stripeClient = createMockStripeClient(async (request) => {
    calls.push(request);
    return {
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_456",
      amount: request.amount,
      currency: request.currency
    };
  });

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: { jobId: 42, proposalId: "prop_1" }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "42",
        proposalId: "prop_1"
      }
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
  let requestBody;
  const stripeClient = createMockStripeClient(async (request) => {
    requestBody = request;
    return {
      id: "pi_default_currency",
      client_secret: "secret",
      amount: request.amount,
      currency: request.currency
    };
  });

  await createPaymentIntent({ amount: 1000 }, { stripeClient });

  assert.deepEqual(requestBody, { amount: 1000, currency: "usd" });
});

test("createPaymentIntent rejects invalid payment input before calling Stripe", async () => {
  let called = false;
  const stripeClient = createMockStripeClient(async () => {
    called = true;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient }),
    /amount must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "us-dollar" }, { stripeClient }),
    /currency must be a three-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: ["bad"] }, { stripeClient }),
    /metadata must be an object/
  );
  assert.equal(called, false);
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeClient = createMockStripeClient(async () => {
    const error = new Error("Your card was declined");
    error.type = "StripeCardError";
    throw error;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 500 }, { stripeClient }),
    /Your card was declined/
  );
});

test(
  "createPaymentIntent smoke test can create a Stripe test-mode payment intent",
  { skip: process.env.STRIPE_LIVE_SMOKE !== "true" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    assert.match(
      process.env.STRIPE_SECRET_KEY,
      /^sk_test_/,
      "smoke test requires a Stripe test-mode secret key"
    );

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smoke: "true" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
  }
);
