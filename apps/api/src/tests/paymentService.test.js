import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent, __setStripeClientForTest } from "../services/paymentService.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  __setStripeClientForTest(undefined);
  delete process.env.STRIPE_SECRET_KEY;
});

test("createPaymentIntent creates a Stripe PaymentIntent", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_example";
  const calls = [];

  __setStripeClientForTest({
    paymentIntents: {
      async create(payload) {
        calls.push(payload);
        return {
          id: "pi_123",
          client_secret: "pi_123_secret_456"
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: { jobId: "job_1" }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: { jobId: "job_1" }
    }
  ]);
  assert.deepEqual(result, {
    paymentId: "pi_123",
    clientSecret: "pi_123_secret_456",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_example";
  let stripePayload;

  __setStripeClientForTest({
    paymentIntents: {
      async create(payload) {
        stripePayload = payload;
        return { id: "pi_123", client_secret: "secret" };
      }
    }
  });

  await createPaymentIntent({ amount: 100 });

  assert.equal(stripePayload.currency, "usd");
});

test("createPaymentIntent validates amount", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /amount must be a positive integer/
  );
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_example";
  __setStripeClientForTest({
    paymentIntents: {
      async create() {
        const error = new Error("Your card was declined.");
        error.type = "StripeCardError";
        throw error;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }),
    /Your card was declined\./
  );
});

test("createPaymentIntent requires STRIPE_SECRET_KEY", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 100 }),
    /STRIPE_SECRET_KEY is required/
  );
});

test("POST /api/payments returns Stripe payment data", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_example";
  __setStripeClientForTest({
    paymentIntents: {
      async create() {
        return { id: "pi_route", client_secret: "pi_route_secret" };
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 500, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.paymentId, "pi_route");
    assert.equal(payload.data.clientSecret, "pi_route_secret");
  });
});

test("createPaymentIntent live Stripe smoke test", { skip: process.env.STRIPE_LIVE_SMOKE !== "1" }, async () => {
  const result = await createPaymentIntent({ amount: 100, currency: "usd" });
  assert.match(result.paymentId, /^pi_/);
  assert.equal(typeof result.clientSecret, "string");
});
