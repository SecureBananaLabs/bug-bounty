import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

function stripeClientReturning(paymentIntent) {
  return {
    paymentIntents: {
      create: async (request) => {
        stripeClientReturning.lastRequest = request;
        return paymentIntent;
      }
    }
  };
}

test("creates a Stripe PaymentIntent with validated request data", async () => {
  const stripeClient = stripeClientReturning({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc",
    amount: 2599,
    currency: "usd"
  });

  const result = await createPaymentIntent(
    {
      amount: 2599,
      metadata: {
        jobId: "job_123",
        priority: 3,
        reviewed: true
      }
    },
    { stripeClient }
  );

  assert.deepEqual(stripeClientReturning.lastRequest, {
    amount: 2599,
    currency: "usd",
    metadata: {
      jobId: "job_123",
      priority: "3",
      reviewed: "true"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2599,
    currency: "usd",
    provider: "stripe"
  });
});

test("defaults currency to usd", async () => {
  const stripeClient = stripeClientReturning({
    id: "pi_test_default",
    client_secret: "pi_test_default_secret",
    amount: 500,
    currency: "usd"
  });

  await createPaymentIntent({ amount: 500 }, { stripeClient });

  assert.equal(stripeClientReturning.lastRequest.currency, "usd");
});

test("rejects invalid amount before calling Stripe", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: stripeClientReturning({}) }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.message.includes("positive integer") &&
      error.statusCode === 400
  );
});

test("preserves Stripe API error messages", async () => {
  const stripeError = Object.assign(new Error("No such payment_method: 'pm_missing'"), {
    type: "StripeInvalidRequestError"
  });
  const stripeClient = {
    paymentIntents: {
      create: async () => {
        throw stripeError;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1200 }, { stripeClient }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.message === "No such payment_method: 'pm_missing'" &&
      error.code === "StripeInvalidRequestError" &&
      error.statusCode === 502
  );
});

test("creates a live Stripe PaymentIntent when smoke test env is enabled", {
  skip: process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createPaymentIntent({
    amount: 50,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.ok(result.clientSecret);
});
