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

async function postPayment(baseUrl, body) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments rejects missing amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload"
    });
  });
});

test("POST /api/payments rejects negative amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: -1, currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload"
    });
  });
});

test("POST /api/payments rejects wrong-type amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: "10", currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload"
    });
  });
});

test("POST /api/payments rejects unsupported currency", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 10, currency: "jpy" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload"
    });
  });
});

test("POST /api/payments creates payment intent with default usd currency", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 25 });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 25);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.equal(typeof payload.data.paymentId, "string");
  });
});
