import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

test("POST /api/auth/refresh regression test suite", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/auth/refresh`;

  await t.test("Success: returns a fresh token with valid token", async () => {
    const originalPayload = { sub: "usr_test_123", role: "freelancer" };
    const validToken = signAccessToken(originalPayload);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: validToken })
    });

    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);

    // Verify the new token holds the same sub and role
    const decoded = jwt.verify(payload.data.token, env.jwtSecret);
    assert.equal(decoded.sub, originalPayload.sub);
    assert.equal(decoded.role, originalPayload.role);
  });

  await t.test("Fail: returns 400 when token is missing in request body", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /missing or invalid/i);
  });

  await t.test("Fail: returns 401 when token is invalid", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token-string" })
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /invalid or expired/i);
  });

  await t.test("Fail: returns 401 when token is expired", async () => {
    const expiredToken = jwt.sign({ sub: "usr_expired", role: "client" }, env.jwtSecret, { expiresIn: "-1s" });

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: expiredToken })
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /invalid or expired/i);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
