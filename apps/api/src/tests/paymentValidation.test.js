import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);

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

test("POST /api/payments rejects non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: -25,
      currency: "usd"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments rejects missing amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, { currency: "usd" });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments creates valid positive payment intents", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 125,
      currency: "cad"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "cad");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
