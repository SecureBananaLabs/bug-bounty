import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  configureStripeClient,
  createPaymentIntent,
  PaymentProviderError,
  PaymentValidationError,
  resetStripeClient
} from "../services/paymentService.js";

test.afterEach(() => {
  resetStripeClient();
});

function mockStripeClient(createPaymentIntentImpl) {
  return {
    paymentIntents: {
      create: createPaymentIntentImpl
    }
  };
}

test("createPaymentIntent creates a Stripe PaymentIntent and maps the response", async () => {
  const calls = [];
  configureStripeClient(
    mockStripeClient(async (params) => {
      calls.push(params);
      return {
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc",
        amount: params.amount,
        currency: params.currency
      };
    })
  );

  const result = await createPaymentIntent({
    amount: 2500,
    metadata: { jobId: "job_123", urgent: true, attempt: 2 }
  });

  assert.deepEqual(calls, [
    {
      amount: 2500,
      currency: "usd",
      metadata: {
        jobId: "job_123",
        urgent: "true",
        attempt: "2"
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

  resetStripeClient();
});

test("createPaymentIntent normalizes provided currency", async () => {
  const calls = [];
  configureStripeClient(
    mockStripeClient(async (params) => {
      calls.push(params);
      return {
        id: "pi_eur",
        client_secret: "pi_eur_secret",
        amount: params.amount,
        currency: params.currency
      };
    })
  );

  await createPaymentIntent({ amount: 1099, currency: "EUR" });

  assert.equal(calls[0].currency, "eur");
});

test("createPaymentIntent validates amount before calling Stripe", async () => {
  let called = false;
  configureStripeClient(
    mockStripeClient(async () => {
      called = true;
    })
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    (error) =>
      error instanceof PaymentValidationError &&
      error.message === "amount must be a positive integer in the smallest currency unit"
  );

  assert.equal(called, false);
});

test("createPaymentIntent validates currency and metadata shape", async () => {
  configureStripeClient(mockStripeClient(async () => ({})));

  await assert.rejects(
    () => createPaymentIntent({ amount: 100, currency: "US" }),
    /currency must be a three-letter ISO currency code/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: ["not", "metadata"] }),
    /metadata must be an object/
  );
  await assert.rejects(
    () => createPaymentIntent({ amount: 100, metadata: { nested: { id: 1 } } }),
    /metadata values must be strings, numbers, or booleans/
  );

});

test("createPaymentIntent preserves Stripe error messages", async () => {
  configureStripeClient(
    mockStripeClient(async () => {
      const error = new Error("Your card was declined");
      error.type = "StripeCardError";
      throw error;
    })
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    (error) =>
      error instanceof PaymentProviderError &&
      error.message === "Stripe payment failed: Your card was declined" &&
      error.cause?.message === "Your card was declined"
  );
});

test("POST /api/payments returns the Stripe client secret", async () => {
  configureStripeClient(
    mockStripeClient(async (params) => ({
      id: "pi_route",
      client_secret: "pi_route_secret",
      amount: params.amount,
      currency: params.currency
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
    body: JSON.stringify({ amount: 4500, currency: "usd" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.paymentId, "pi_route");
  assert.equal(payload.data.clientSecret, "pi_route_secret");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test(
  "guarded Stripe smoke test creates a real test-mode PaymentIntent",
  { skip: process.env.RUN_STRIPE_SMOKE_TEST !== "1" || !process.env.STRIPE_SECRET_KEY },
  async () => {
    resetStripeClient();
    const result = await createPaymentIntent({
      amount: 100,
      currency: "usd",
      metadata: { source: "securebanana-bounty-smoke" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.amount, 100);
    assert.equal(result.currency, "usd");
  }
);
