import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/auth/refresh rejects missing token", async () => {
  const app = createApp();
  const server = app.listen(0);
  await listen(server);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);

  await close(server);
});

test("POST /api/auth/refresh rejects invalid token", async () => {
  const app = createApp();
  const server = app.listen(0);
  await listen(server);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "garbage-token-value" })
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);

  await close(server);
});

test("POST /api/auth/refresh returns a new token for valid refresh", async () => {
  const app = createApp();
  const server = app.listen(0);
  await listen(server);
  const { port } = server.address();

  // Login first to get a valid token
  const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "password123" })
  });
  const loginBody = await loginRes.json();
  assert.ok(loginBody.data.token, "Login should return a token");

  // Use the login token to refresh
  const refreshRes = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: loginBody.data.token })
  });

  assert.equal(refreshRes.status, 200);
  const refreshBody = await refreshRes.json();
  assert.ok(refreshBody.data.token, "Refresh should return a new token");

  await close(server);
});
