import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/payments preserves submitted jobId", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();

    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        amount: 2500,
        currency: "usd",
        jobId: "job_123"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 2500);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.equal(payload.data.jobId, "job_123");
    assert.match(payload.data.paymentId, /^pay_/);
  } finally {
    await close(server);
  }
});
