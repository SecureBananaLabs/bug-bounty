import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/login returns an access token and refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");
    assert.equal(typeof payload.data.refreshToken, "string");
  });
});

test("POST /api/auth/refresh requires a refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/refresh", {});
    const payload = await response.json();

    assert.equal(response.status, 400);
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

test("POST /api/auth/refresh mints a new access token from a refresh token", async () => {
  await withServer(async (baseUrl) => {
    const loginResponse = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });
    const loginPayload = await loginResponse.json();

    const response = await postJson(baseUrl, "/api/auth/refresh", {
      refreshToken: loginPayload.data.refreshToken
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");
    assert.equal(payload.data.refreshToken, undefined);
  });
});
