import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/payments rejects non-positive amounts", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const invalidPayloads = [
      { amount: -100, currency: "usd" },
      { amount: 0, currency: "usd" },
      { amount: "free", currency: "usd" }
    ];

    for (const invalidPayload of invalidPayloads) {
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(invalidPayload)
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Payment amount must be a positive number"
      });
    }
  } finally {
    await stopServer(server);
  }
});

test("POST /api/payments still accepts valid payment payloads", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount: 125, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  } finally {
    await stopServer(server);
  }
});
