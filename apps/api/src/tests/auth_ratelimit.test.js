import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Rate limiting and health bypass suite", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. GET /health bypasses rate limiting and returns 200
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data, { ok: true, service: "api" });
    }

    // 2. POST /api/auth/login allows exactly 5 requests
    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `user${i}@example.com`, password: "password123" })
      });
      assert.equal(res.status, 200, `Login request #${i} should succeed (200)`);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data?.token, "Login payload should return JWT token");
    }

    // 3. 6th attempt must be blocked with HTTP 429 Too Many Requests
    const blockedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user6@example.com", password: "password123" })
    });
    assert.equal(blockedRes.status, 429, "6th login attempt must be throttled with HTTP 429");

    // 4. Unrelated endpoints remain available (not blocked by login limiter)
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200, "Health check must remain accessible");

    const jobsRes = await fetch(`${baseUrl}/api/jobs`);
    assert.equal(jobsRes.status, 200, "Jobs endpoint must remain accessible");
  } finally {
    await new Promise((resolve, reject) => {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
