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
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/payments rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {});

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments rejects non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {
      amount: 0,
      currency: "usd"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments accepts valid payments", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {
      amount: 100,
      currency: "usd"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 100);
    assert.equal(payload.data.currency, "usd");
  });
});
