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

async function postPayment(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { response, body: await response.json() };
}

test("POST /api/payments creates a payment intent with default currency", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postPayment(baseUrl, { amount: 250 });

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.amount, 250);
    assert.equal(body.data.currency, "usd");
    assert.equal(body.data.provider, "stripe");
  });
});

test("POST /api/payments normalizes three-letter currency codes", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postPayment(baseUrl, {
      amount: 99,
      currency: " EUR "
    });

    assert.equal(response.status, 201);
    assert.equal(body.data.currency, "eur");
  });
});

test("POST /api/payments rejects non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postPayment(baseUrl, { amount: 0 });

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid payment payload");
  });
});

test("POST /api/payments rejects malformed currency codes", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postPayment(baseUrl, {
      amount: 25,
      currency: "usdc"
    });

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
  });
});
