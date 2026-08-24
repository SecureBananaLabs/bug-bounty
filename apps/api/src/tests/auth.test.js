import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Authentication flow (registration, login, invalid login)", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  // 1. Test registration
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "testuser@example.com",
      password: "password123",
      role: "client"
    })
  });
  const registerPayload = await registerResponse.json();

  assert.equal(registerResponse.status, 201);
  assert.equal(registerPayload.success, true);
  assert.equal(registerPayload.data.email, "testuser@example.com");
  assert.ok(registerPayload.data.token);

  // 2. Test successful login
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "testuser@example.com",
      password: "password123"
    })
  });
  const loginPayload = await loginResponse.json();

  assert.equal(loginResponse.status, 200);
  assert.equal(loginPayload.success, true);
  assert.equal(loginPayload.data.email, "testuser@example.com");
  assert.ok(loginPayload.data.token);

  // 3. Test failed login (wrong password)
  const failedLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "testuser@example.com",
      password: "wrongpassword"
    })
  });
  const failedLoginPayload = await failedLoginResponse.json();

  assert.equal(failedLoginResponse.status, 401);
  assert.equal(failedLoginPayload.success, false);
  assert.equal(failedLoginPayload.message, "Invalid credentials");

  // 4. Test failed login (non-existent email)
  const nonExistentResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "nonexistent@example.com",
      password: "password123"
    })
  });
  const nonExistentPayload = await nonExistentResponse.json();

  assert.equal(nonExistentResponse.status, 401);
  assert.equal(nonExistentPayload.success, false);
  assert.equal(nonExistentPayload.message, "Invalid credentials");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
