import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("POST /api/auth/login blocks login when user status is DISABLED", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "disabled_user@example.com",
      password: "password123",
      status: "DISABLED"
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Account is disabled");
  assert.equal(payload.code, "ACCOUNT_DISABLED");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "attacker@example.com",
      password: "password123",
      role: "admin"
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation error");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/login succeeds for valid credentials and returns valid JWT token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // 1. Register user
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "validuser@example.com",
      password: "securePassword123!",
      role: "client"
    })
  });
  const regPayload = await regRes.json();
  assert.equal(regRes.status, 201);
  assert.equal(regPayload.success, true);
  const userId = regPayload.data.id;

  // 2. Login with valid credentials
  const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "validuser@example.com",
      password: "securePassword123!"
    })
  });

  const loginPayload = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.equal(loginPayload.success, true);
  assert.equal(loginPayload.data.email, "validuser@example.com");

  const decoded = verifyAccessToken(loginPayload.data.token);
  assert.equal(decoded.sub, userId);
  assert.equal(decoded.role, "client");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/login rejects unknown email with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "nonexistent@example.com",
      password: "somePassword123"
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.code, "INVALID_CREDENTIALS");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/login rejects wrong password with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "client@example.com",
      password: "wrongPassword123!"
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.code, "INVALID_CREDENTIALS");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
