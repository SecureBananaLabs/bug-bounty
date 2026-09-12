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

test("payment creation rejects invalid request bodies", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 0,
        currency: "",
        jobId: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation error");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("amount")));
    assert.ok(payload.issues.some((issue) => issue.path.includes("currency")));
    assert.ok(payload.issues.some((issue) => issue.path.includes("jobId")));
  });
});

test("payment creation accepts validated payment fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: 125,
        currency: "USD",
        jobId: "job_123",
        paymentId: "pay_attacker",
        provider: "attacker"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.paymentId, /^pay_/);
    assert.notEqual(payload.data.paymentId, "pay_attacker");
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.jobId, "job_123");
    assert.equal(payload.data.provider, "stripe");
  });
});
