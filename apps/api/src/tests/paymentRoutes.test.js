import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { setStripeFactoryForTests } from "../services/paymentService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  setStripeFactoryForTests();
});

test("POST /api/payments returns Stripe client secret and payment id", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeFactoryForTests(() => ({
    paymentIntents: {
      create: async () => ({
        id: "pi_route_123",
        client_secret: "pi_route_123_secret_456"
      })
    }
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1500 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.paymentId, "pi_route_123");
    assert.equal(payload.data.clientSecret, "pi_route_123_secret_456");
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments surfaces validation errors", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -1 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /amount is required/);
  });
});
