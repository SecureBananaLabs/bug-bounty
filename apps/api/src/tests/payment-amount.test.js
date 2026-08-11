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
    return await callback(`http://127.0.0.1:${port}`);
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

test("payment creation rejects zero amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {
      amount: 0,
      currency: "usd"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  });
});

test("payment creation rejects negative amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {
      amount: -10,
      currency: "usd"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  });
});

test("payment creation preserves valid positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {
      amount: 25,
      currency: "nzd"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 25);
    assert.equal(payload.data.currency, "nzd");
    assert.equal(payload.data.provider, "stripe");
  });
});
