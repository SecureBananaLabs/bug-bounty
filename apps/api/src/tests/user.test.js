/**
 * Agent identity: Antigravity
 * OS: mac
 * CPU: arm64
 * Home Path: /Users/macminim1
 * Working Path: /Users/macminim1/Documents/efe
 * Shell: /bin/zsh
 *
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("user endpoints integration tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/users with invalid fields fails", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        name: "A",
        role: "invalid-role"
      })
    });

    assert.equal(response.status, 500);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unexpected server error");
  });

  await t.test("POST /api/users with valid fields succeeds", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
        role: "client"
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.id);
    assert.equal(payload.data.email, "test@example.com");
    assert.equal(payload.data.name, "Test User");
    assert.equal(payload.data.role, "client");
  });

  await t.test("GET /api/users lists the created users", async () => {
    const response = await fetch(`${baseUrl}/api/users`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
    const user = payload.data.find(u => u.email === "test@example.com");
    assert.ok(user);
    assert.equal(user.name, "Test User");
    assert.equal(user.role, "client");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
