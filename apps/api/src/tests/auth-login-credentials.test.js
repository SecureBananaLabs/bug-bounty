import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/login accepts matching registered credentials", async () => {
  const server = await startServer();
  const { port } = server.address();
  const email = `login-ok-${Date.now()}@example.com`;
  const password = "password123";

  const registerResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "client" })
  });
  assert.equal(registerResponse.status, 201);

  const loginResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const loginPayload = await loginResponse.json();

  assert.equal(loginResponse.status, 200);
  assert.equal(loginPayload.success, true);
  assert.equal(loginPayload.data.email, email);
  assert.equal(typeof loginPayload.data.token, "string");
  assert.ok(loginPayload.data.token.length > 0);

  await stopServer(server);
});

test("POST /api/auth/login rejects invalid credentials with expected error", async () => {
  const server = await startServer();
  const { port } = server.address();
  const email = `login-fail-${Date.now()}@example.com`;

  const registerResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123", role: "client" })
  });
  assert.equal(registerResponse.status, 201);

  const loginResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "wrongpass123" })
  });
  const loginPayload = await loginResponse.json();

  assert.equal(loginResponse.status, 401);
  assert.deepEqual(loginPayload, {
    success: false,
    message: "Invalid email or password"
  });

  await stopServer(server);
});
