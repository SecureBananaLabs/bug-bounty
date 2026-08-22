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

test("POST /api/payments rejects non-positive and non-numeric amounts", async () => {
  await withServer(async (baseUrl) => {
    for (const amount of [0, -25, "100", null]) {
      const response = await postPayment(baseUrl, { amount });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Payment amount must be a positive number"
      });
    }
  });
});

test("POST /api/payments creates payment intents for positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 1250,
      currency: "eur"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 1250);
    assert.equal(payload.data.currency, "eur");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
