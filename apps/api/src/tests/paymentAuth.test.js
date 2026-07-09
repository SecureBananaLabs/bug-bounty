import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/payments authentication enforcer", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("rejects unauthenticated payment requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount: 1000, currency: "usd" })
    });
    assert.equal(res.status, 401);
  });
});
