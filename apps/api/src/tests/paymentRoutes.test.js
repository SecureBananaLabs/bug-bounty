import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  resetStripeClientForTesting,
  setStripeClientForTesting
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
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  resetStripeClientForTesting();
});

test("POST /api/payments creates a Stripe PaymentIntent and returns the client secret", async () => {
  const calls = [];
  setStripeClientForTesting({
    paymentIntents: {
      async create(params) {
        calls.push(params);
        return {
          id: "pi_route_123",
          client_secret: "pi_route_123_secret_456",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 4200,
        currency: "EUR",
        metadata: { jobId: "job_route" }
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      paymentId: "pi_route_123",
      clientSecret: "pi_route_123_secret_456",
      amount: 4200,
      currency: "eur",
      provider: "stripe"
    });
    assert.deepEqual(calls, [
      {
        amount: 4200,
        currency: "eur",
        metadata: { jobId: "job_route" }
      }
    ]);
  });
});

test("POST /api/payments returns a descriptive 400 for invalid amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "amount is required and must be a positive integer in the smallest currency unit"
    });
  });
});

test("POST /api/payments returns the original Stripe error message", async () => {
  setStripeClientForTesting({
    paymentIntents: {
      async create() {
        const error = new Error("No such payment_intent.");
        error.type = "StripeInvalidRequestError";
        error.statusCode = 404;
        throw error;
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1500 })
    });
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, {
      success: false,
      message: "No such payment_intent."
    });
  });
});
