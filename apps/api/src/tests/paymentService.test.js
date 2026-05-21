import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import {
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientForTests
} from "../services/paymentService.js";

function mockStripeClient(handler) {
  return {
    paymentIntents: {
      create: handler
    }
  };
}

test.afterEach(() => {
  resetStripeClientForTests();
  env.stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
});

test("createPaymentIntent creates Stripe PaymentIntent and maps response fields", async () => {
  const calls = [];
  setStripeClientForTests(
    mockStripeClient(async (params) => {
      calls.push(params);
      return {
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc"
      };
    })
  );

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: {
      jobId: "job_123",
      retry: 2
    }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        retry: "2"
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

test("createPaymentIntent validates amount and currency before Stripe call", async () => {
  let stripeCalled = false;
  setStripeClientForTests(
    mockStripeClient(async () => {
      stripeCalled = true;
    })
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    /amount is required and must be a positive integer/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "usdollar" }),
    /currency must be a 3-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: ["bad"] }),
    /metadata must be an object/
  );
  assert.equal(stripeCalled, false);
});

test("createPaymentIntent preserves Stripe error messages", async () => {
  setStripeClientForTests(
    mockStripeClient(async () => {
      const error = new Error("Your card was declined.");
      error.type = "StripeCardError";
      throw error;
    })
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 500 }),
    /Your card was declined\./
  );
});

test("POST /api/payments returns clientSecret from mocked Stripe", async () => {
  setStripeClientForTests(
    mockStripeClient(async (params) => ({
      id: `pi_${params.amount}`,
      client_secret: `secret_${params.currency}`
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
    body: JSON.stringify({ amount: 1250 })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.paymentId, "pi_1250");
  assert.equal(payload.data.clientSecret, "secret_usd");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("guarded Stripe smoke creates a real test-mode PaymentIntent when explicitly enabled", async (t) => {
  if (process.env.STRIPE_PAYMENT_SMOKE !== "true" || !process.env.STRIPE_SECRET_KEY) {
    t.skip("Set STRIPE_PAYMENT_SMOKE=true and STRIPE_SECRET_KEY=sk_test_... to run live smoke test");
    return;
  }

  resetStripeClientForTests();
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { smoke: "true" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /_secret_/);
});
