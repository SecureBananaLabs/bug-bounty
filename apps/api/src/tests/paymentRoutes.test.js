import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { setStripeClientForTests } from "../services/paymentService.js";

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

test("POST /api/payments returns Stripe client secret", async () => {
  setStripeClientForTests({
    paymentIntents: {
      async create() {
        return {
          id: "pi_route_123",
          client_secret: "pi_route_123_secret"
        };
      }
    }
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1999 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.paymentId, "pi_route_123");
    assert.equal(payload.data.clientSecret, "pi_route_123_secret");
  });
});

test("POST /api/payments returns 400 for invalid amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "amount must be a positive integer in the smallest currency unit");
  });
});
