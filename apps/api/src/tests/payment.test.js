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

  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/payments/:id with non-existent id returns 404", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/payments/non_existent_pay_id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Payment not found");
  });
});

test("POST /api/payments creates payment and GET /api/payments/:id retrieves it", async () => {
  await withServer(async (baseUrl) => {
    const createRes = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 5000, currency: "usd" }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.success, true);
    assert.ok(created.data.paymentId);
    assert.equal(created.data.amount, 5000);
    assert.equal(created.data.currency, "usd");

    const getRes = await fetch(`${baseUrl}/api/payments/${created.data.paymentId}`);
    assert.equal(getRes.status, 200);
    const retrieved = await getRes.json();
    assert.equal(retrieved.success, true);
    assert.equal(retrieved.data.paymentId, created.data.paymentId);
    assert.equal(retrieved.data.amount, 5000);
  });
});
