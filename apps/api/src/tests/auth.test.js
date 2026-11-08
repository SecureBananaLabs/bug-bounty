import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh returns 401 when unauthenticated", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST"
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh returns 401 with invalid token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: "Bearer invalid.token.signature"
    }
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid token");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh succeeds and preserves subject and role", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const originalSub = "usr_special_freelancer_777";
  const originalRole = "freelancer";
  const incomingToken = signAccessToken({ sub: originalSub, role: originalRole });

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${incomingToken}`
    }
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.token);

  const decoded = verifyAccessToken(payload.data.token);
  assert.equal(decoded.sub, originalSub);
  assert.equal(decoded.role, originalRole);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
