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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments rejects invalid payment payloads", async () => {
  await withServer(async (baseUrl) => {
    const invalidPayloads = [
      {},
      { amount: -1000 },
      { amount: "1000" },
      { amount: 1000, currency: "eur" }
    ];

    for (const payload of invalidPayloads) {
      const response = await postPayment(baseUrl, payload);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(body, { success: false, message: "Invalid payment payload" });
    }
  });
});

test("POST /api/payments defaults valid payments to usd", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 2500 });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.paymentId, /^pay_\d+$/);
    assert.equal(body.data.amount, 2500);
    assert.equal(body.data.currency, "usd");
  });
});

test("POST /api/payments accepts supported usd currency", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 5000, currency: "usd" });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.amount, 5000);
    assert.equal(body.data.currency, "usd");
  });
});
