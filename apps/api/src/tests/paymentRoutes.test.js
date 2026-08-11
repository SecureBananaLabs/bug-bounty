import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, body) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments accepts valid payment payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 1500,
      currency: "usd",
      jobId: "job_123"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 1500);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});

test("POST /api/payments rejects missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      currency: "usd",
      jobId: "job_123"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.path.includes("amount")));
  });
});

test("POST /api/payments rejects non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 0,
      currency: "usd",
      jobId: "job_123"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.path.includes("amount")));
  });
});

test("POST /api/payments rejects caller-supplied system fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 1500,
      currency: "usd",
      jobId: "job_123",
      paymentId: "pay_attacker",
      provider: "other"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.code === "unrecognized_keys"));
  });
});
