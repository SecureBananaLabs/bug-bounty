import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(run) {
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

test("POST /api/payments rejects invalid payment amounts", async () => {
  await withTestServer(async (baseUrl) => {
    for (const amount of [-100, 0, "free"]) {
      const response = await postPayment(baseUrl, { amount, currency: "usd" });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, "Payment amount must be a positive number");
    }
  });
});

test("POST /api/payments accepts positive numeric amounts", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { amount: 125, currency: "USD" });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
