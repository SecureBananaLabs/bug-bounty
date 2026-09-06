import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh accepts authenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "user-1" });

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.token);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh rejects invalid tokens", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: "Bearer invalid-token-here" },
  });

  assert.equal(response.status, 401);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
