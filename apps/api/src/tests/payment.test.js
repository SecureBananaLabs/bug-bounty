import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentIntent, initStripe, resetStripeForTests } from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeForTests();
  delete process.env.STRIPE_SECRET_KEY;
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  const stripeMock = createStripeMock();
  initStripe("sk_test_mock", stripeMock);

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /amount must be a positive integer/
  );
  assert.equal(stripeMock.calls.length, 0);
});

test("createPaymentIntent calls Stripe with amount, default currency, and metadata", async () => {
  const stripeMock = createStripeMock({
    id: "pi_mocked",
    client_secret: "pi_mocked_secret",
    amount: 2500,
    currency: "usd"
  });
  initStripe("sk_test_mock", stripeMock);

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: {
      jobId: "job_123",
      attempt: 2
    }
  });

  assert.deepEqual(stripeMock.calls[0], {
    amount: 2500,
    currency: "usd",
    metadata: {
      jobId: "job_123",
      attempt: "2"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_mocked",
    clientSecret: "pi_mocked_secret",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  const stripeMock = createStripeMock(null, new Error("Your card was declined"));
  initStripe("sk_test_mock", stripeMock);

  await assert.rejects(
    () => createPaymentIntent({ amount: 500, currency: "USD" }),
    /Your card was declined/
  );
});

test("POST /api/payments returns useful validation and provider errors", async () => {
  const { baseUrl, close } = await startServer();
  const stripeMock = createStripeMock(null, new Error("No such customer"));
  initStripe("sk_test_mock", stripeMock);

  const validation = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: -1 })
  });
  const provider = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 1200 })
  });

  assert.equal(validation.status, 400);
  assert.match((await validation.json()).message, /amount must be a positive integer/);
  assert.equal(provider.status, 502);
  assert.equal((await provider.json()).message, "No such customer");

  await close();
});

test("guarded Stripe smoke creates a test PaymentIntent when explicitly enabled", { skip: process.env.RUN_STRIPE_SMOKE !== "1" }, async () => {
  resetStripeForTests();
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: {
      source: "guarded-smoke-test"
    }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /^pi_/);
});

function createStripeMock(response = {
  id: "pi_default",
  client_secret: "pi_default_secret",
  amount: 1000,
  currency: "usd"
}, error) {
  const calls = [];

  return {
    calls,
    paymentIntents: {
      create: async (payload) => {
        calls.push(payload);
        if (error) {
          throw error;
        }
        return response;
      }
    }
  };
}

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}
