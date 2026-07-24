import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { setStripeClientForTesting } from "../services/paymentService.js";

async function withServer(app, callback) {
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
  setStripeClientForTesting(undefined);
});

test("POST /api/payments returns a client secret from Stripe", async () => {
  setStripeClientForTesting({
    paymentIntents: {
      async create(payload) {
        assert.deepEqual(payload, { amount: 1200, currency: "usd", metadata: {} });
        return {
          id: "pi_route_123",
          client_secret: "pi_route_123_secret_abc"
        };
      }
    }
  });

  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1200 })
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.paymentId, "pi_route_123");
    assert.equal(body.data.clientSecret, "pi_route_123_secret_abc");
  });
});

test("POST /api/payments returns 400 for invalid amount", async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /amount must be a positive integer/);
  });
});
