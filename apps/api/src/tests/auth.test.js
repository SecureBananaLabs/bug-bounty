import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await handler(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/register persists users and login validates credentials", async () => {
  const email = `auth-${Date.now()}@example.com`;
  const password = "supersecret1";

  await withServer(async (port) => {
    const registerResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "freelancer" })
    });

    const registerPayload = await registerResponse.json();

    assert.equal(registerResponse.status, 201);
    assert.equal(registerPayload.success, true);
    assert.equal(registerPayload.data.email, email);
    assert.equal(registerPayload.data.role, "freelancer");
    assert.match(registerPayload.data.id, /^usr_/);
    assert.match(registerPayload.data.token, /^eyJ/);

    const loginResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.success, true);
    assert.equal(loginPayload.data.email, email);
    assert.match(loginPayload.data.token, /^eyJ/);

    const invalidLoginResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrongpass" })
    });

    const invalidLoginPayload = await invalidLoginResponse.json();

    assert.equal(invalidLoginResponse.status, 401);
    assert.equal(invalidLoginPayload.success, false);
    assert.equal(invalidLoginPayload.message, "Invalid email or password");

    const duplicateResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "freelancer" })
    });

    const duplicatePayload = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(duplicatePayload.success, false);
    assert.equal(duplicatePayload.message, "Email is already registered");
  });
});
