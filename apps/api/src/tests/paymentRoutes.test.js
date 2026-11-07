import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import {
  resetStripeClientForTesting,
  setStripeClientForTesting
} from "../services/paymentService.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const address = server.address();
    await callback("http://127.0.0.1:" + address.port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  resetStripeClientForTesting();
});

test("POST /api/payments creates a PaymentIntent through Stripe", async () => {
  const calls = [];
  setStripeClientForTesting({
    paymentIntents: {
      async create(params, requestOptions) {
        calls.push({ params, requestOptions });
        return {
          id: "pi_route_123",
          client_secret: "pi_route_123_secret_abc",
          amount: params.amount,
          currency: params.currency
        };
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl + "/api/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 3200,
        currency: "EUR",
        metadata: { jobId: "job_route", clientId: "client_route" },
        idempotencyKey: "job_route:client_route:3200"
      })
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      success: true,
      data: {
        paymentId: "pi_route_123",
        clientSecret: "pi_route_123_secret_abc",
        amount: 3200,
        currency: "eur",
        provider: "stripe"
      }
    });
  });

  assert.deepEqual(calls, [
    {
      params: {
        amount: 3200,
        currency: "eur",
        metadata: { jobId: "job_route", clientId: "client_route" }
      },
      requestOptions: { idempotencyKey: "job_route:client_route:3200" }
    }
  ]);
});

test("POST /api/payments returns validation errors without calling Stripe", async () => {
  let stripeCalls = 0;
  setStripeClientForTesting({
    paymentIntents: {
      async create() {
        stripeCalls += 1;
        throw new Error("Stripe should not be called");
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl + "/api/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 0, currency: "usd" })
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Payment amount must be a positive integer in the smallest currency unit"
    });
  });

  assert.equal(stripeCalls, 0);
});

test("POST /api/payments preserves Stripe provider messages", async () => {
  setStripeClientForTesting({
    paymentIntents: {
      async create() {
        const error = new Error("Your card has insufficient funds");
        error.type = "StripeCardError";
        error.statusCode = 402;
        throw error;
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl + "/api/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1500, currency: "usd" })
    });

    assert.equal(response.status, 402);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Stripe payment failed: Your card has insufficient funds"
    });
  });
});
