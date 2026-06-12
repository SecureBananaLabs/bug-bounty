import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/login rejects unknown email", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: `missing-${randomUUID()}@example.com`,
        password: "password123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid credentials" });
  });
});

test("POST /api/auth/login rejects wrong password", async () => {
  await withServer(async (port) => {
    const email = `known-${randomUUID()}@example.com`;

    const registerResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: "password123",
        role: "client"
      })
    });
    assert.equal(registerResponse.status, 201);

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: "wrongpass"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid credentials" });
  });
});

test("POST /api/auth/login succeeds for a registered user", async () => {
  await withServer(async (port) => {
    const email = `valid-${randomUUID()}@example.com`;

    const registerResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: "password123",
        role: "freelancer"
      })
    });
    const registerPayload = await registerResponse.json();

    assert.equal(registerResponse.status, 201);
    assert.equal(registerPayload.success, true);
    assert.equal(registerPayload.data.email, email);

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: "password123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, email);
    assert.equal(typeof payload.data.token, "string");
    assert.ok(payload.data.token.length > 0);
  });
});
