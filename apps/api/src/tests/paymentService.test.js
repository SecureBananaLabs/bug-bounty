import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  PaymentServiceError,
  createPaymentIntent,
  resetStripeClientForTests,
  setStripeClientForTests
} from "../services/paymentService.js";

afterEach(() => {
  resetStripeClientForTests();
});

test("createPaymentIntent creates a Stripe PaymentIntent with normalized input", async () => {
  let capturedPayload;
  setStripeClientForTests({
    paymentIntents: {
      create: async (payload) => {
        capturedPayload = payload;
        return {
          id: "pi_test_123",
          client_secret: "pi_test_secret_123",
          amount: payload.amount,
          currency: payload.currency
        };
      }
    }
  });

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: {
      orderId: 42,
      customerTier: "pro",
      invoiceReady: true
    }
  });

  assert.deepEqual(capturedPayload, {
    amount: 2500,
    currency: "usd",
    metadata: {
      orderId: "42",
      customerTier: "pro",
      invoiceReady: "true"
    }
  });
  assert.deepEqual(result, {
    paymentId: "pi_test_123",
    clientSecret: "pi_test_secret_123",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  let capturedPayload;
  setStripeClientForTests({
    paymentIntents: {
      create: async (payload) => {
        capturedPayload = payload;
        return {
          id: "pi_default_currency",
          client_secret: "pi_default_currency_secret",
          amount: payload.amount,
          currency: payload.currency
        };
      }
    }
  });

  await createPaymentIntent({ amount: 1000 });

  assert.equal(capturedPayload.currency, "usd");
  assert.equal(capturedPayload.metadata, undefined);
});

test("createPaymentIntent rejects invalid payment amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.status === 400 &&
      error.message ===
        "Amount must be a positive integer in the smallest currency unit"
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.message ===
        "Amount must be a positive integer in the smallest currency unit"
  );
});

test("createPaymentIntent rejects invalid metadata before calling Stripe", async () => {
  setStripeClientForTests({
    paymentIntents: {
      create: async () => {
        throw new Error("Stripe should not be called for invalid metadata");
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, metadata: ["not", "object"] }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.status === 400 &&
      error.message === "Metadata must be an object"
  );
});

test("createPaymentIntent preserves Stripe provider error messages", async () => {
  setStripeClientForTests({
    paymentIntents: {
      create: async () => {
        const stripeError = new Error("Your card was declined.");
        stripeError.statusCode = 402;
        throw stripeError;
      }
    }
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 1000, currency: "usd" }),
    (error) =>
      error instanceof PaymentServiceError &&
      error.status === 402 &&
      error.message === "Your card was declined."
  );
});

test("POST /api/payments returns the created Stripe client secret", async () => {
  setStripeClientForTests({
    paymentIntents: {
      create: async (payload) => ({
        id: "pi_route_123",
        client_secret: "pi_route_secret_123",
        amount: payload.amount,
        currency: payload.currency
      })
    }
  });

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
    body: JSON.stringify({ amount: 1200 })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(payload, {
    success: true,
    data: {
      paymentId: "pi_route_123",
      clientSecret: "pi_route_secret_123",
      amount: 1200,
      currency: "usd",
      provider: "stripe"
    }
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/payments returns validation errors through middleware", async () => {
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
    message: "Amount must be a positive integer in the smallest currency unit"
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test(
  "optionally creates a real Stripe test PaymentIntent",
  {
    skip:
      process.env.RUN_STRIPE_SMOKE !== "1" ||
      !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
  },
  async () => {
    resetStripeClientForTests();

    const result = await createPaymentIntent({
      amount: 50,
      currency: "usd",
      metadata: { source: "api-smoke-test" }
    });

    assert.match(result.paymentId, /^pi_/);
    assert.match(result.clientSecret, /^pi_/);
    assert.equal(result.provider, "stripe");
  }
);
