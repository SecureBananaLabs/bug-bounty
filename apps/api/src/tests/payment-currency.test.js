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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, payload) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/payments defaults supported currency to usd", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 5000 });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments normalizes supported currency", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 5000, currency: " USD " });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments rejects unsupported currency", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 5000, currency: "eur" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported payment currency"
    });
  });
});

test("POST /api/payments rejects non-string currency", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 5000, currency: 123 });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported payment currency"
    });
  });
});
