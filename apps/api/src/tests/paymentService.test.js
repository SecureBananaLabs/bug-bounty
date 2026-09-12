import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  PaymentProviderError,
  PaymentValidationError,
  createPaymentIntent
} from "../services/paymentService.js";

function createMockStripeClient(paymentIntentOrError) {
  const calls = [];

  return {
    calls,
    paymentIntents: {
      async create(payload) {
        calls.push(payload);

        if (paymentIntentOrError instanceof Error) {
          throw paymentIntentOrError;
        }

        return paymentIntentOrError;
      }
    }
  };
}

test("createPaymentIntent validates input and creates a Stripe PaymentIntent", async () => {
  const stripe = createMockStripeClient({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_test"
  });

  const result = await createPaymentIntent(
    {
      amount: 1299,
      metadata: {
        jobId: "job_123",
        expedited: true
      }
    },
    stripe
  );

  assert.deepEqual(stripe.calls, [
    {
      amount: 1299,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        expedited: "true"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_test",
    amount: 1299,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects missing or invalid amounts before calling Stripe", async () => {
  const stripe = createMockStripeClient({
    id: "pi_should_not_be_created",
    client_secret: "unused"
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, stripe),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message.includes("positive integer")
  );

  assert.deepEqual(stripe.calls, []);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeError = new Error("Missing required param: amount.");
  stripeError.type = "StripeInvalidRequestError";

  const stripe = createMockStripeClient(stripeError);

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "USD" }, stripe),
    (error) =>
      error instanceof PaymentProviderError &&
      error.name === "StripeInvalidRequestError" &&
      error.message === "Missing required param: amount."
  );
});

test("POST /api/payments surfaces validation errors", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: -100 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /positive integer/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test(
  "createPaymentIntent can run a live Stripe smoke test when explicitly enabled",
  {
    skip:
      process.env.RUN_STRIPE_SMOKE_TEST === "1" &&
      process.env.STRIPE_SECRET_KEY
        ? false
        : "Set RUN_STRIPE_SMOKE_TEST=1 and STRIPE_SECRET_KEY to run the live Stripe smoke test"
  },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        source: "api-smoke-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.equal(typeof result.clientSecret, "string");
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
