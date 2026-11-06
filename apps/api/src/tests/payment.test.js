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

test("POST /api/payments rejects invalid amounts", async () => {
  await withServer(async (baseUrl) => {
    const invalidBodies = [
      { amount: -100, currency: "usd" },
      { amount: 0, currency: "usd" },
      { amount: "free", currency: "usd" }
    ];

    for (const body of invalidBodies) {
      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.match(payload.message, /amount/i);
    }
  });
});

test("POST /api/payments creates payment for a valid amount", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 25, currency: "EUR" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 25);
    assert.equal(payload.data.currency, "EUR");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});

test("POST /api/payments validates optional currency codes", async () => {
  await withServer(async (baseUrl) => {
    const missingCurrencyResponse = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 25 })
    });
    const missingCurrencyPayload = await missingCurrencyResponse.json();

    assert.equal(missingCurrencyResponse.status, 201);
    assert.equal(missingCurrencyPayload.data.currency, "usd");

    const invalidCurrencyResponse = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 25, currency: "us1" })
    });
    const invalidCurrencyPayload = await invalidCurrencyResponse.json();

    assert.equal(invalidCurrencyResponse.status, 400);
    assert.equal(invalidCurrencyPayload.success, false);
    assert.match(invalidCurrencyPayload.message, /currency/i);
  });
});
