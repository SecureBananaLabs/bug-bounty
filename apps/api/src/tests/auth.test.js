import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/auth/login rejects unknown users", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: `missing-${Date.now()}@example.com`,
      password: "validpass123"
    });

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid credentials"
    });
  });
});

test("POST /api/auth/login rejects mismatched passwords", async () => {
  await withServer(async (baseUrl) => {
    const email = `auth-${Date.now()}@example.com`;

    await postJson(baseUrl, "/api/auth/register", {
      email,
      password: "correctpass123",
      role: "client"
    });

    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "wrongpass123"
    });

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid credentials"
    });
  });
});

test("POST /api/auth/login issues tokens for registered credentials", async () => {
  await withServer(async (baseUrl) => {
    const email = `auth-success-${Date.now()}@example.com`;

    const registration = await postJson(baseUrl, "/api/auth/register", {
      email,
      password: "correctpass123",
      role: "freelancer"
    });

    assert.equal(registration.response.status, 201);
    assert.equal(registration.payload.data.email, email);
    assert.equal(registration.payload.data.role, "freelancer");
    assert.equal("password" in registration.payload.data, false);

    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "correctpass123"
    });

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, email);
    assert.equal(typeof payload.data.token, "string");
    assert.equal("password" in payload.data, false);
  });
});
