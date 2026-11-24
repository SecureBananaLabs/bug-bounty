import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import { createApp } from "../app.js";
import {
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientForTests
} from "../services/paymentService.js";

const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

afterEach(() => {
  resetStripeClientForTests();
  mock.reset();

  if (originalStripeSecretKey) {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
  } else {
    delete process.env.STRIPE_SECRET_KEY;
  }
});

function createMockStripeClient(handler) {
  return {
    paymentIntents: {
      create: mock.fn(handler)
    }
  };
}

test("createPaymentIntent validates input and calls Stripe PaymentIntents", async () => {
  const stripeClient = createMockStripeClient(async (request) => ({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc",
    amount: request.amount,
    currency: request.currency
  }));

  setStripeClientForTests(stripeClient);

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: {
      jobId: "job_123",
      urgent: true
    }
  });

  assert.deepEqual(stripeClient.paymentIntents.create.mock.calls[0].arguments[0], {
    amount: 2500,
    currency: "usd",
    metadata: {
      jobId: "job_123",
      urgent: "true"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects missing or invalid amounts", async () => {
  await assert.rejects(() => createPaymentIntent({}), /amount is required/);
  await assert.rejects(() => createPaymentIntent({ amount: 0 }), /amount is required/);
  await assert.rejects(() => createPaymentIntent({ amount: 10.5 }), /amount is required/);
});

test("createPaymentIntent validates currency and metadata", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollars" }),
    /currency must be a three-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: ["job_123"] }),
    /metadata must be an object/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: { nested: { id: "job_123" } } }),
    /metadata values must be strings, numbers, or booleans/
  );
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeError = new Error("No such payment_method: pm_missing");
  stripeError.type = "StripeInvalidRequestError";

  setStripeClientForTests(
    createMockStripeClient(async () => {
      throw stripeError;
    })
  );

  await assert.rejects(() => createPaymentIntent({ amount: 1500 }), /No such payment_method: pm_missing/);
});

test("createPaymentIntent requires STRIPE_SECRET_KEY when no test client is injected", async () => {
  delete process.env.STRIPE_SECRET_KEY;

  await assert.rejects(
    () => createPaymentIntent({ amount: 1500 }),
    /STRIPE_SECRET_KEY is required to create Stripe payments/
  );
});

test("POST /api/payments returns a Stripe PaymentIntent response", async () => {
  setStripeClientForTests(
    createMockStripeClient(async (request) => ({
      id: "pi_route_123",
      client_secret: "pi_route_123_secret_abc",
      amount: request.amount,
      currency: request.currency
    }))
  );

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
    body: JSON.stringify({ amount: 3200, currency: "GBP" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(payload, {
    success: true,
    data: {
      paymentId: "pi_route_123",
      clientSecret: "pi_route_123_secret_abc",
      amount: 3200,
      currency: "gbp",
      provider: "stripe"
    }
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test(
  "createPaymentIntent can create a live Stripe test-mode PaymentIntent when explicitly enabled",
  { skip: process.env.STRIPE_PAYMENT_SMOKE !== "true" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    resetStripeClientForTests();

    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: {
        smoke: true,
        source: "freelanceflow-api-test"
      }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_.*_secret_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
