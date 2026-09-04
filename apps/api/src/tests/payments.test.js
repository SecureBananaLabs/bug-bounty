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

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function createPayment(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json();
  assert.equal(response.status, 201);
  return body.data;
}

test("POST /api/payments normalizes payment currencies", async () => {
  await withServer(async (baseUrl) => {
    const defaultCurrency = await createPayment(baseUrl, { amount: 1000 });
    const mixedCaseCurrency = await createPayment(baseUrl, {
      amount: 1000,
      currency: " USD "
    });
    const blankCurrency = await createPayment(baseUrl, {
      amount: 1000,
      currency: "   "
    });
    const nonStringCurrency = await createPayment(baseUrl, {
      amount: 1000,
      currency: 123
    });

    assert.equal(defaultCurrency.currency, "usd");
    assert.equal(mixedCaseCurrency.currency, "usd");
    assert.equal(blankCurrency.currency, "usd");
    assert.equal(nonStringCurrency.currency, "usd");
  });
});
