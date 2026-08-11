import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

test("POST /api/auth/refresh validates refresh token and preserves user", async () => {
  await withServer(async (baseUrl) => {
    const login = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });

    assert.equal(login.response.status, 200);
    assert.equal(typeof login.payload.data.token, "string");
    assert.equal(typeof login.payload.data.refreshToken, "string");

    const refreshed = await postJson(baseUrl, "/api/auth/refresh", {
      refreshToken: login.payload.data.refreshToken
    });

    assert.equal(refreshed.response.status, 200);
    assert.equal(typeof refreshed.payload.data.token, "string");

    const decoded = verifyAccessToken(refreshed.payload.data.token);
    assert.equal(decoded.sub, "usr_existing");
    assert.equal(decoded.role, "client");
  });
});

test("POST /api/auth/refresh rejects invalid and access tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await postJson(baseUrl, "/api/auth/refresh", {});

    assert.equal(missing.response.status, 400);
    assert.equal(missing.payload.success, false);

    const invalid = await postJson(baseUrl, "/api/auth/refresh", {
      refreshToken: "not-a-token"
    });

    assert.equal(invalid.response.status, 401);
    assert.equal(invalid.payload.success, false);

    const accessToken = signAccessToken({ sub: "usr_existing", role: "client" });
    const accessAsRefresh = await postJson(baseUrl, "/api/auth/refresh", {
      refreshToken: accessToken
    });

    assert.equal(accessAsRefresh.response.status, 401);
    assert.equal(accessAsRefresh.payload.success, false);
  });
});
