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
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments rejects invalid amounts", async () => {
  await withServer(async (baseUrl) => {
    const invalidPayloads = [
      {},
      { amount: 0, currency: "usd" },
      { amount: -10, currency: "usd" },
      { amount: "10", currency: "usd" },
      { amount: Number.NaN, currency: "usd" }
    ];

    for (const payload of invalidPayloads) {
      const response = await postPayment(baseUrl, payload);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        success: false,
        message: "Payment amount must be a positive number"
      });
    }
  });
});

test("POST /api/payments accepts positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 42, currency: "usd" });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.amount, 42);
    assert.equal(body.data.currency, "usd");
    assert.equal(body.data.provider, "stripe");
    assert.match(body.data.paymentId, /^pay_\d+$/);
  });
});
