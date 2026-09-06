import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("payment creation rejects invalid amounts", async () => {
  await withServer(async (baseUrl) => {
    const negativeAmount = await postPayment(baseUrl, { amount: -10, currency: "usd" });
    const missingAmount = await postPayment(baseUrl, { currency: "usd" });
    const validPayment = await postPayment(baseUrl, { amount: 25, currency: "usd" });

    assert.equal(negativeAmount.response.status, 400);
    assert.equal(negativeAmount.payload.success, false);
    assert.equal(missingAmount.response.status, 400);
    assert.equal(missingAmount.payload.success, false);
    assert.equal(validPayment.response.status, 201);
    assert.equal(validPayment.payload.success, true);
    assert.equal(validPayment.payload.data.amount, 25);
  });
});
