import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validPayload = {
  amount: 2500,
  currency: "USD"
};

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/payments rejects invalid payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 0, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid payment payload" });
  });
});

test("POST /api/payments accepts valid payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, validPayload.amount);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
  });
});
