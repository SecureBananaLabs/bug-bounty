import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function withServer(run) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function registration(overrides = {}) {
  return {
    email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: "secret123",
    role: "client",
    ...overrides
  };
}

test("POST /api/auth/login rejects unknown users", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "missing@example.com", password: "secret123" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid credentials" });
  });
});

test("POST /api/auth/login rejects wrong passwords", async () => {
  await withServer(async (port) => {
    const payload = registration();
    await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: "wrongpass" })
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid credentials" });
  });
});

test("POST /api/auth/login issues a token for the registered user", async () => {
  await withServer(async (port) => {
    const payload = registration({ role: "freelancer" });
    const registerResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const registered = await registerResponse.json();

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.email, payload.email);

    const claims = jwt.verify(body.data.token, env.jwtSecret);
    assert.equal(claims.sub, registered.data.id);
    assert.equal(claims.role, "freelancer");
  });
});
