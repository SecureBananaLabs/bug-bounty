import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  resetPaymentServiceForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  resetPaymentServiceForTests();
});

test("POST /api/payments returns Stripe payment intent details", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async (params) => ({
        id: "pi_route_123",
        client_secret: "pi_route_123_secret_abc",
        amount: params.amount,
        currency: params.currency
      })
    }
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 2500, currency: "USD" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        paymentId: "pi_route_123",
        clientSecret: "pi_route_123_secret_abc",
        amount: 2500,
        currency: "usd",
        provider: "stripe"
      }
    });
  });
});

test("POST /api/payments surfaces validation errors", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "amount must be a positive integer in the smallest currency unit"
    });
  });
});

test("POST /api/payments preserves Stripe provider error messages", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async () => {
        const error = new Error("No such customer.");
        error.type = "StripeInvalidRequestError";
        error.statusCode = 400;
        throw error;
      }
    }
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 500, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "No such customer."
    });
  });
});
