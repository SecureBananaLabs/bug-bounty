import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
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

test("refresh endpoint rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, {});

    assert.equal(response.status, 401);
  });
});

test("refresh endpoint rejects access token", async () => {
  await withServer(async (baseUrl) => {
    const accessToken = signAccessToken({ sub: "usr_existing", role: "client" });
    const response = await postRefresh(baseUrl, { refreshToken: accessToken });

    assert.equal(response.status, 401);
  });
});

test("refresh endpoint rejects invalid token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { refreshToken: "not-a-jwt" });

    assert.equal(response.status, 401);
  });
});

test("refresh endpoint accepts refresh token and reissues access token", async () => {
  await withServer(async (baseUrl) => {
    const refreshToken = signRefreshToken({ sub: "usr_existing", role: "client" });
    const response = await postRefresh(baseUrl, { refreshToken });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(decoded.sub, "usr_existing");
    assert.equal(decoded.role, "client");
    assert.equal(decoded.tokenType, "access");
  });
});
