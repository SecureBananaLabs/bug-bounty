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

test("POST /api/payments returns 400 for non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 0,
        currency: "USD"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload"
    });
  });
});

test("POST /api/payments normalizes valid currency and preserves default", async () => {
  await withServer(async (baseUrl) => {
    const withCurrencyResponse = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 25,
        currency: " USD "
      })
    });
    const withCurrencyPayload = await withCurrencyResponse.json();

    assert.equal(withCurrencyResponse.status, 201);
    assert.equal(withCurrencyPayload.success, true);
    assert.equal(withCurrencyPayload.data.amount, 25);
    assert.equal(withCurrencyPayload.data.currency, "usd");

    const defaultCurrencyResponse = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 15
      })
    });
    const defaultCurrencyPayload = await defaultCurrencyResponse.json();

    assert.equal(defaultCurrencyResponse.status, 201);
    assert.equal(defaultCurrencyPayload.success, true);
    assert.equal(defaultCurrencyPayload.data.currency, "usd");
  });
});
