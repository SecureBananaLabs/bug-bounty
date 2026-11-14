import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent, initStripe, resetStripeForTests } from "../services/paymentService.js";

function stripeMock(response = {}) {
  const calls = [];
  return {
    calls,
    client: {
      paymentIntents: {
        create: async (payload) => {
          calls.push(payload);
          return {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_abc",
            amount: payload.amount,
            currency: payload.currency,
            ...response
          };
        }
      }
    }
  };
}

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  resetStripeForTests();
});

test("createPaymentIntent validates and maps Stripe PaymentIntent fields", async () => {
  const mock = stripeMock();
  initStripe({ client: mock.client });

  const result = await createPaymentIntent({
    amount: 1250,
    currency: "USD",
    metadata: { jobId: "job_101", retry: 2 }
  });

  assert.deepEqual(mock.calls[0], {
    amount: 1250,
    currency: "usd",
    metadata: { jobId: "job_101", retry: "2" }
  });
  assert.equal(result.paymentId, "pi_test_123");
  assert.equal(result.clientSecret, "pi_test_123_secret_abc");
  assert.equal(result.provider, "stripe");
});

test("createPaymentIntent rejects invalid inputs before calling Stripe", async () => {
  const mock = stripeMock();
  initStripe({ client: mock.client });

  await assert.rejects(() => createPaymentIntent({ currency: "usd" }), /amount is required/);
  await assert.rejects(() => createPaymentIntent({ amount: 0 }), /positive integer/);
  await assert.rejects(() => createPaymentIntent({ amount: 100, currency: "usdt" }), /3-letter/);
  await assert.rejects(() => createPaymentIntent({ amount: 100, metadata: [] }), /metadata must be an object/);
  assert.equal(mock.calls.length, 0);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  initStripe({
    client: {
      paymentIntents: {
        create: async () => {
          const error = new Error("Your card was declined.");
          error.type = "StripeCardError";
          error.statusCode = 402;
          throw error;
        }
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "usd" }),
    (error) => error.message === "Your card was declined." && error.statusCode === 402
  );
});

test("POST /api/payments returns Stripe client secret", async () => {
  const mock = stripeMock();
  initStripe({ client: mock.client });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 9900 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.paymentId, "pi_test_123");
    assert.equal(payload.data.clientSecret, "pi_test_123_secret_abc");
    assert.deepEqual(mock.calls[0], { amount: 9900, currency: "usd", metadata: {} });
  });
});

test("live Stripe smoke creates a test-mode PaymentIntent when explicitly enabled", {
  skip: process.env.RUN_STRIPE_SMOKE !== "1" || !process.env.STRIPE_SECRET_KEY
}, async () => {
  resetStripeForTests();
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.ok(result.clientSecret);
});
