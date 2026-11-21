import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

test("createPaymentIntent validates and sends Stripe PaymentIntent arguments", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        return {
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc"
        };
      }
    }
  };

  const result = await createPaymentIntent(
    {
      amount: 2500,
      currency: "USD",
      metadata: {
        jobId: 42,
        milestone: "deposit"
      }
    },
    { stripeClient }
  );

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "42",
        milestone: "deposit"
      }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_123_secret_abc",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent rejects invalid amount, currency, and metadata", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: {} }),
    /positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usdollars" }, { stripeClient: {} }),
    /three-letter/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: [] }, { stripeClient: {} }),
    /metadata must be an object/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeClient = {
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  };

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }, { stripeClient }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.statusCode === 502 &&
      error.message === "Your card was declined."
  );
});

test("POST /api/payments maps validation errors to HTTP responses", async () => {
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
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
  "guarded Stripe smoke creates a test-mode PaymentIntent",
  { skip: process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { smoke: "true" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
  }
);
