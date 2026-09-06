import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/login returns 429 after 20 requests in 15-minute window", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/auth/login`;

  // Send 20 requests (should all succeed or fail with 400, not 429)
  for (let i = 0; i < 20; i++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" })
    });
    // First 20 should not be 429
    assert.notEqual(response.status, 429, `Request ${i + 1} should not be rate limited`);
  }

  // 21st request should return 429
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" })
  });

  assert.equal(response.status, 429);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("too many"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
