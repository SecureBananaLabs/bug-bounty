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

test("POST /api/payments rejects missing, negative, wrong-type, and unsupported currency payloads", async () => {
  await withServer(async (port) => {
    const invalidPayloads = [
      {},
      { amount: -10, currency: "usd" },
      { amount: "10", currency: "usd" },
      { amount: 10, currency: "gbp" }
    ];

    for (const payload of invalidPayloads) {
      const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
    }
  });
});

test("POST /api/payments accepts valid payloads and preserves usd default", async () => {
  await withServer(async (port) => {
    const validDefault = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 25 })
    });
    const validDefaultPayload = await validDefault.json();

    assert.equal(validDefault.status, 201);
    assert.equal(validDefaultPayload.success, true);
    assert.equal(validDefaultPayload.data.amount, 25);
    assert.equal(validDefaultPayload.data.currency, "usd");

    const validExplicit = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 40, currency: "eur" })
    });
    const validExplicitPayload = await validExplicit.json();

    assert.equal(validExplicit.status, 201);
    assert.equal(validExplicitPayload.success, true);
    assert.equal(validExplicitPayload.data.amount, 40);
    assert.equal(validExplicitPayload.data.currency, "eur");
    assert.match(validExplicitPayload.data.paymentId, /^pay_/);
  });
});
