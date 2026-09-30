import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/payments validates positive finite amounts", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/payments`;

  try {
    for (const amount of [0, -50, "abc"]) {
      await t.test(`rejects invalid amount: ${String(amount)}`, async () => {
        const res = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount })
        });
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.equal(body.success, false);
      });
    }

    await t.test("accepts a valid positive finite amount", async () => {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 150, currency: "usd" })
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.amount, 150);
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
