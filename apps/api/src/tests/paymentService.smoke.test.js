import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const runSmokeTest = process.env.STRIPE_SMOKE_TEST === "1";
const smokeTest = runSmokeTest ? test : test.skip;

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

smokeTest("POST /api/payments creates a real Stripe PaymentIntent in test mode", async () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required when STRIPE_SMOKE_TEST=1");
  }

  const app = createApp();
  const server = await startServer(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "usd" }),
    });

    const text = await response.text();
    assert.equal(response.status, 201, `Unexpected status: ${text}`);

    const body = JSON.parse(text);
    assert.equal(typeof body.clientSecret, "string", "clientSecret should be a string");
    assert.match(body.paymentId, /^pi_/, "paymentId should start with pi_");
  } finally {
    await stopServer(server);
  }
});
