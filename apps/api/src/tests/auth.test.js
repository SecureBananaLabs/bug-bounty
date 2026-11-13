import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

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

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/refresh", {});
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Refresh token is required"
    });
  });
});

test("POST /api/auth/refresh rejects access tokens", async () => {
  await withServer(async (baseUrl) => {
    const loginResponse = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });
    const loginPayload = await loginResponse.json();

    const response = await postJson(baseUrl, "/api/auth/refresh", {
      refreshToken: loginPayload.data.token
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid refresh token"
    });
  });
});

test("POST /api/auth/refresh issues a token for a valid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const loginResponse = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 200);
    assert.equal(typeof loginPayload.data.refreshToken, "string");

    const response = await postJson(baseUrl, "/api/auth/refresh", {
      refreshToken: loginPayload.data.refreshToken
    });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(decoded.sub, "usr_existing");
    assert.equal(decoded.role, "client");
  });
});

test("register returns refresh token tied to the created user", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/register", {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 201);
    assert.equal(typeof payload.data.refreshToken, "string");
    assert.equal(decoded.sub, payload.data.id);
    assert.equal(decoded.role, "admin");
  });
});
