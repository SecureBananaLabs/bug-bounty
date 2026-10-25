import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh without token returns 401", async () => {
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

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh with invalid token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: "Bearer invalid-token" }
  });

  assert.equal(response.status, 401);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh with valid token returns new token for same user", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const originalToken = signAccessToken({ sub: "usr_test123", role: "admin" });

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${originalToken}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.success);
  assert.ok(payload.data.token);

  // Decode the new token and verify it has the same subject and role
  const parts = payload.data.token.split(".");
  const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
  assert.equal(decoded.sub, "usr_test123");
  assert.equal(decoded.role, "admin");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
