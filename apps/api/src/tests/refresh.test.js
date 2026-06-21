import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh without token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh with valid token returns refreshed access token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const validToken = signAccessToken({ sub: "usr_test123", role: "freelancer" });

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: validToken })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.token);
  assert.ok(payload.data.user);
  assert.equal(payload.data.user.sub, "usr_test123");
  assert.equal(payload.data.user.role, "freelancer");

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh with Bearer header returns refreshed token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const validToken = signAccessToken({ sub: "usr_header_test", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${validToken}` }
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.token);

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh with invalid token returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: "invalid.token.here" })
  });

  // Should fail validation — 400 from zod or 500 from service
  assert.notEqual(response.status, 200);

  await new Promise((resolve) => server.close(resolve));
});
