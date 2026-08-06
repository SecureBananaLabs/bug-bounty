import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postRefresh(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects requests without a refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Refresh token is required" });
  });
});

test("POST /api/auth/refresh rejects malformed refresh tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { refreshToken: "not-a-jwt" });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid refresh token" });
  });
});

test("POST /api/auth/refresh rejects access tokens used as refresh tokens", async () => {
  await withServer(async (baseUrl) => {
    const accessToken = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await postRefresh(baseUrl, { refreshToken: accessToken });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid refresh token" });
  });
});

test("POST /api/auth/refresh exchanges a valid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const refreshToken = signRefreshToken({ sub: "usr_client", role: "client" });
    const response = await postRefresh(baseUrl, { refreshToken });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");

    const accessClaims = verifyAccessToken(payload.data.token);
    assert.equal(accessClaims.sub, "usr_client");
    assert.equal(accessClaims.role, "client");
    assert.equal(accessClaims.tokenType, undefined);
  });
});
