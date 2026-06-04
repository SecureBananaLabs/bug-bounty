import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Bug #1823: registerSchema role restrictions", () => {
  // Valid roles should not throw
  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "client@banana.com",
      password: "securepassword123",
      role: "client"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "freelancer@banana.com",
      password: "securepassword123",
      role: "freelancer"
    });
  });

  // admin role should be rejected and throw a ZodError
  assert.throws(() => {
    registerSchema.parse({
      email: "attacker@banana.com",
      password: "securepassword123",
      role: "admin"
    });
  });
});

test("Bug #1823: refresh endpoint validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/auth/refresh without token fails with 401", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Token required");
  });

  await t.test("POST /api/auth/refresh with invalid token fails with 401", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid_token_xyz" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  });

  await t.test("POST /api/auth/refresh with valid token succeeds", async () => {
    const validToken = signAccessToken({ sub: "usr_123", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: validToken })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
