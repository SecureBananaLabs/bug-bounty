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

test("POST /api/payments rejects negative amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -100, currency: "usd" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload",
    });
  });
});

test("POST /api/payments rejects missing amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currency: "usd" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload",
    });
  });
});

test("POST /api/payments still creates valid payment intents", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "usd" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.paymentId, /^pay_\d+$/);
    assert.equal(payload.data.amount, 100);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
  });
});
