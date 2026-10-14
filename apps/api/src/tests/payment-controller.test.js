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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/payments accepts valid payloads and defaults currency to usd", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 125.5 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125.5);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
  });
});

test("POST /api/payments rejects missing or negative amounts", async () => {
  await withServer(async (port) => {
    for (const body of [{}, { amount: -1 }]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid payment payload"
      });
    }
  });
});

test("POST /api/payments rejects wrong-type and unsupported currency values", async () => {
  await withServer(async (port) => {
    for (const body of [{ amount: "50" }, { amount: 50, currency: "cad" }]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid payment payload"
      });
    }
  });
});
