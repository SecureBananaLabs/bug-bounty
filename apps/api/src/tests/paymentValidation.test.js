import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, body) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments rejects missing amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.errors[0].path[0], "amount");
  });
});

test("POST /api/payments rejects non-positive amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: -10, currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.errors[0].path[0], "amount");
  });
});

test("POST /api/payments rejects invalid currency code length", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 50, currency: "us" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.errors[0].path[0], "currency");
  });
});

test("POST /api/payments creates payment intent for valid payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 50, currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 50);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
