import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("POST /api/payments returns validation errors as JSON", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 0 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Payment amount must be a positive integer in the smallest currency unit"
    });
  });
});

test("POST /api/payments requires Stripe configuration after payload validation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1000 })
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(payload, {
      success: false,
      message: "STRIPE_SECRET_KEY is required to create payment intents"
    });
  });
});
