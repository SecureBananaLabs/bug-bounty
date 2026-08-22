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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, body) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments defaults currency and creates a valid payment intent", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 125 });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
  });
});

test("POST /api/payments normalizes valid currency codes", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 42, currency: "EUR" });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.currency, "eur");
  });
});

test("POST /api/payments rejects non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const zeroResponse = await postPayment(baseUrl, { amount: 0 });
    const negativeResponse = await postPayment(baseUrl, { amount: -1 });

    assert.equal(zeroResponse.status, 400);
    assert.equal(negativeResponse.status, 400);
  });
});

test("POST /api/payments rejects malformed currency codes", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 10, currency: "USDT" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid payment payload");
  });
});
