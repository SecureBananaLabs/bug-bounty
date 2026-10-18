import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { loginUser, registerUser } from "../services/authService.js";

test("POST /api/auth/register allows client and freelancer roles", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  for (const role of ["client", "freelancer"]) {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `user_${role}_${Date.now()}@example.com`,
        password: "password123",
        role
      })
    });

    const payload = await res.json();
    assert.equal(res.status, 201);
    assert.equal(payload.data.role, role);
  }

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

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin_test@example.com",
      password: "password123",
      role: "admin"
    })
  });

  assert.equal(res.status, 400);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/login verifies credentials and returns token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const testEmail = `login_user_${Date.now()}@example.com`;
  const testPass = "securePassword123";

  // 1. Register user
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPass, role: "freelancer" })
  });
  assert.equal(regRes.status, 201);

  // 2. Successful login
  const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPass })
  });
  const loginPayload = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.equal(loginPayload.data.email, testEmail);
  assert.equal(loginPayload.data.role, "freelancer");
  assert.ok(loginPayload.data.token);

  // 3. Failed login - Wrong Password
  const wrongPassRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "wrongpassword" })
  });
  assert.equal(wrongPassRes.status, 401);

  // 4. Failed login - Unknown Email
  const unknownEmailRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "unknown@example.com", password: testPass })
  });
  assert.equal(unknownEmailRes.status, 401);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
