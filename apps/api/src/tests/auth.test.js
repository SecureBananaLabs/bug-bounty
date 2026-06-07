import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh rejects empty body", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh rejects invalid token", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "invalid.token.here" })
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.ok(body.error.includes("Invalid") || body.error.includes("invalid"));

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh accepts valid token and preserves subject", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const sub = "usr_test_123";
  const role = "freelancer";
  const refreshToken = signAccessToken({ sub, role });

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: refreshToken })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.token);

  // 验证新 token 包含相同的 sub 和 role
  const jwt = await import("jsonwebtoken");
  const { env } = await import("../config/env.js");
  const decoded = jwt.default.verify(body.data.token, env.jwtSecret);
  assert.equal(decoded.sub, sub);
  assert.equal(decoded.role, role);

  await new Promise((resolve) => server.close(resolve));
});
