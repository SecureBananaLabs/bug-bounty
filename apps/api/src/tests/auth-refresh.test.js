import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postRefresh(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("refresh endpoint requires a valid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const missing = await postRefresh(baseUrl, {});
    const accessToken = signAccessToken({ sub: "usr_client", role: "client" });
    const wrongTokenType = await postRefresh(baseUrl, { refreshToken: accessToken });
    const refreshToken = signRefreshToken({ sub: "usr_refresh", role: "freelancer" });
    const refreshed = await postRefresh(baseUrl, { refreshToken });
    const refreshedPayload = verifyAccessToken(refreshed.payload.data.token);

    assert.equal(missing.response.status, 400);
    assert.equal(missing.payload.success, false);
    assert.equal(wrongTokenType.response.status, 401);
    assert.equal(wrongTokenType.payload.success, false);
    assert.equal(refreshed.response.status, 200);
    assert.equal(refreshedPayload.sub, "usr_refresh");
    assert.equal(refreshedPayload.role, "freelancer");
  });
});
