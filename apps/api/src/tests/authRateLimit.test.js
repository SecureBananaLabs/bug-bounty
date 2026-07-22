import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("auth routes enforce stricter rate limit on /api/auth/login", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  // Hit the login endpoint 21 times; the 21st should be rate-limited
  for (let i = 1; i <= 20; i++) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
    });
    // Should NOT be rate-limited yet
    if (res.status === 429) {
      assert.fail(`Rate limited too early on request ${i}`);
    }
  }

  // 21st request should be rate-limited (429)
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
  });
  assert.equal(res.status, 429, "21st request should return 429 Too Many Requests");
  const payload = await res.json();
  assert.equal(payload.message, "Too many requests, please try again later.");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
