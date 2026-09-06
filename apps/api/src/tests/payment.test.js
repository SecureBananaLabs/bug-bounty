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
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/payments defaults currency to usd", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, { amount: 25 });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments accepts uppercase usd and normalizes it", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, { amount: 25, currency: "USD" });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments rejects unsupported currencies", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, { amount: 25, currency: "eur" });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "payment currency must be usd"
    });
  });
});

test("POST /api/payments rejects non-string currencies", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, { amount: 25, currency: 840 });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "payment currency must be usd"
    });
  });
});
