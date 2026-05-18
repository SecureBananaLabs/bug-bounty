import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { createPaymentIntent } from "../services/paymentService.js";

function createStripeMock(createImpl) {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        async create(args) {
          calls.push(args);
          return createImpl(args);
        }
      }
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent and maps the response", async () => {
  const stripe = createStripeMock(async (args) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_456",
    amount: args.amount,
    currency: args.currency
  }));

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: { jobId: "job_123" }
    },
    { stripeClient: stripe.client }
  );

  assert.deepEqual(stripe.calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { jobId: "job_123" }
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
  const stripe = createStripeMock(async (args) => ({
    id: "pi_default_currency",
    client_secret: "secret_default_currency",
    amount: args.amount,
    currency: args.currency
  }));

  await createPaymentIntent({ amount: 999 }, { stripeClient: stripe.client });

  assert.equal(stripe.calls[0].currency, "usd");
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const stripe = createStripeMock(async () => {
    throw new Error("Stripe should not be called");
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: stripe.client }),
    /amount must be a positive integer/
  );
  assert.equal(stripe.calls.length, 0);
});

test("createPaymentIntent validates currency before calling Stripe", async () => {
  const stripe = createStripeMock(async () => {
    throw new Error("Stripe should not be called");
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "us-dollar" }, { stripeClient: stripe.client }),
    /currency must be a three-letter ISO currency code/
  );
  assert.equal(stripe.calls.length, 0);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripe = createStripeMock(async () => {
    const error = new Error("Your card was declined");
    error.type = "StripeCardError";
    throw error;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient: stripe.client }),
    /Stripe payment intent creation failed: Your card was declined/
  );
});

test("POST /api/payments surfaces validation errors to callers", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: -1 })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "amount must be a positive integer in the smallest currency unit"
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("createPaymentIntent can run a guarded live Stripe smoke test", {
  skip: !process.env.RUN_STRIPE_SMOKE || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.equal(typeof result.clientSecret, "string");
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
