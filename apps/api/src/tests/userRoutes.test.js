import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("User routes authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/users`;
  const validToken = signAccessToken({ sub: "admin-1", role: "admin" });

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  await t.test("GET /api/users without auth header returns 401", async () => {
    const res = await fetch(baseUrl);
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("GET /api/users with invalid bearer token returns 401", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: "Bearer bad.token.here" }
    });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("GET /api/users with valid bearer token returns 200", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  await t.test("POST /api/users remains publicly accessible for registration", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `test-${Date.now()}@example.com`, password: "password123", name: "New User" })
    });
    // Should not return 401 Unauthorized
    assert.notEqual(res.status, 401);
  });
});
