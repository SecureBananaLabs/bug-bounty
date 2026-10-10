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

async function postPayment(baseUrl, amount) {
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount })
  });

  return { response, payload: await response.json() };
}

test("payment creation rejects negative amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, -100);

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Amount must be a positive number"
    });
  });
});

test("payment creation rejects zero amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, 0);

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Amount must be a positive number"
    });
  });
});

test("payment creation rejects non-number amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, "100");

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Amount must be a positive number"
    });
  });
});

test("payment creation accepts positive numeric amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, 125);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.provider, "stripe");
  });
});
