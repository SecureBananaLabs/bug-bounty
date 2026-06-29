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

async function postPayment(baseUrl, body) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments rejects nonpositive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 0, currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment request"
    });
  });
});

test("POST /api/payments rejects missing amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment request"
    });
  });
});

test("POST /api/payments rejects non-numeric amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: "25", currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment request"
    });
  });
});

test("POST /api/payments rejects unsupported currencies", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 25, currency: "btc" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment request"
    });
  });
});

test("POST /api/payments creates a payment for valid input", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 25, currency: "USD" });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.paymentId, /^pay_\d+$/);
    assert.equal(payload.data.amount, 25);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
  });
});
