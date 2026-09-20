import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("POST /api/payments accepts a finite positive amount", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 12.5, currency: "usd" })
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 12.5);
  });
});

test("POST /api/payments rejects zero, negative, non-finite, and non-numeric amounts", async () => {
  await withServer(async (base) => {
    for (const amount of [0, -1, "12", null, "not-a-number"]) {
      const response = await fetch(`${base}/api/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const payload = await response.json();
      assert.equal(response.status, 400, `amount ${String(amount)} should be rejected`);
      assert.equal(payload.success, false);
      assert.equal(payload.message, "Invalid request");
    }
  });
});
