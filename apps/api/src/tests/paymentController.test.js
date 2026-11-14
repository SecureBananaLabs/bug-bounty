import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  resetStripeClientForTests,
  setStripeClientFactoryForTests
} from "../services/paymentService.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test.afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  resetStripeClientForTests();
});

test("POST /api/payments returns PaymentIntent details", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  setStripeClientFactoryForTests(() => ({
    paymentIntents: {
      create: async () => ({
        id: "pi_route_123",
        client_secret: "pi_route_123_secret"
      })
    }
  }));

  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 1200 })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.paymentId, "pi_route_123");
  assert.equal(payload.data.clientSecret, "pi_route_123_secret");
  assert.equal(payload.data.currency, "usd");

  await close(server);
});

test("POST /api/payments returns validation errors as 400", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 0 })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Payment amount is required and must be a positive integer."
  });

  await close(server);
});
