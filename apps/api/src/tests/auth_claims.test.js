import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("authMiddleware validates required identity claims in JWT", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Missing Authorization header -> 401 Unauthorized
    const unauthRes = await fetch(`${baseUrl}/api/admin/metrics`);
    const unauthPayload = await unauthRes.json();
    assert.equal(unauthRes.status, 401);
    assert.equal(unauthPayload.success, false);
    assert.equal(unauthPayload.message, "Unauthorized");

    // 2. Token missing 'sub' claim -> 401 Invalid token
    const missingSubToken = signAccessToken({ role: "admin" });
    const missingSubRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${missingSubToken}` }
    });
    const missingSubPayload = await missingSubRes.json();
    assert.equal(missingSubRes.status, 401);
    assert.equal(missingSubPayload.success, false);
    assert.equal(missingSubPayload.message, "Invalid token");

    // 3. Token with empty string 'sub' -> 401 Invalid token
    const emptySubToken = signAccessToken({ sub: "   ", role: "admin" });
    const emptySubRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${emptySubToken}` }
    });
    const emptySubPayload = await emptySubRes.json();
    assert.equal(emptySubRes.status, 401);
    assert.equal(emptySubPayload.success, false);
    assert.equal(emptySubPayload.message, "Invalid token");

    // 4. Token with invalid role -> 401 Invalid token
    const invalidRoleToken = signAccessToken({ sub: "usr_123", role: "super_admin" });
    const invalidRoleRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${invalidRoleToken}` }
    });
    const invalidRolePayload = await invalidRoleRes.json();
    assert.equal(invalidRoleRes.status, 401);
    assert.equal(invalidRolePayload.success, false);
    assert.equal(invalidRolePayload.message, "Invalid token");

    // 5. Valid token with valid sub and role -> 200 OK
    const validToken = signAccessToken({ sub: "usr_123", role: "admin" });
    const validRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    const validPayload = await validRes.json();
    assert.equal(validRes.status, 200);
    assert.equal(validPayload.success, true);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
