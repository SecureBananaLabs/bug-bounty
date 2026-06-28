import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Bug #1907: Auth endpoint rate limiting", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("Allows up to 20 requests and blocks the 21st request", async () => {
    // Send 20 requests to an auth endpoint
    for (let i = 0; i < 20; i++) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `user${i}@example.com`,
          password: "password123"
        })
      });
      // Should not be 429
      assert.notEqual(response.status, 429);
    }

    // The 21st request should be rate-limited
    const response21 = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user21@example.com",
        password: "password123"
      })
    });

    const payload = await response21.json();
    assert.equal(response21.status, 429);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Too many login/registration attempts, please try again after 15 minutes");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
