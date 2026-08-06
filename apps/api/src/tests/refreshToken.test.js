import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/refresh`, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.issues[0].path[0], "refreshToken");
  });
});

test("POST /api/auth/refresh rejects invalid refresh token", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/refresh`, {
      refreshToken: "not-a-valid-token"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Invalid refresh token");
  });
});

test("POST /api/auth/refresh mints a token after verification succeeds", async () => {
  await withTestServer(async (baseUrl) => {
    const loginResponse = await postJson(`${baseUrl}/api/auth/login`, {
      email: "client@example.com",
      password: "password123"
    });
    const loginPayload = await loginResponse.json();

    const response = await postJson(`${baseUrl}/api/auth/refresh`, {
      refreshToken: loginPayload.data.token
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof payload.data.token, "string");
    assert.ok(payload.data.token.length > 0);
  });
});
