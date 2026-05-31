import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  createPaymentIntent,
  resetStripeClientForTest,
  setStripeClientForTest
} from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeClientForTest();
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0, currency: "usd" }),
    /amount must be a positive integer/
  );
});

test("createPaymentIntent creates a Stripe PaymentIntent with validated payload", async () => {
  const calls = [];
  setStripeClientForTest({
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        return { id: "pi_test_123", client_secret: "pi_secret_123" };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 1250,
    currency: "USD",
    metadata: { jobId: "job_123" }
  });

  assert.deepEqual(calls, [
    {
      amount: 1250,
      currency: "usd",
      metadata: { jobId: "job_123" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_secret_123",
    amount: 1250,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent preserves Stripe provider error messages", async () => {
  setStripeClientForTest({
    paymentIntents: {
      async create() {
        const error = new Error("No such customer");
        error.type = "StripeInvalidRequestError";
        throw error;
      }
    }
  });

  await assert.rejects(() => createPaymentIntent({ amount: 1000 }), /No such customer/);
});

test("POST /api/payments returns client secret from the mocked Stripe client", async () => {
  setStripeClientForTest({
    paymentIntents: {
      async create(payload) {
        assert.equal(payload.amount, 2500);
        assert.equal(payload.currency, "usd");
        return { id: "pi_api_123", client_secret: "secret_api_123" };
      }
    }
  });

  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 2500 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.paymentId, "pi_api_123");
    assert.equal(payload.data.clientSecret, "secret_api_123");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("live Stripe smoke creates a test-mode PaymentIntent when explicitly enabled", {
  skip: process.env.RUN_STRIPE_PAYMENT_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
}, async () => {
  const result = await createPaymentIntent({ amount: 100, currency: "usd" });
  assert.ok(result.paymentId.startsWith("pi_"));
  assert.ok(result.clientSecret);
});
