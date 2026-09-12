import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/refresh rejects requests without refreshToken", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "refreshToken is required" });
  });
});

test("POST /api/auth/refresh rejects access tokens", async () => {
  await withServer(async (baseUrl) => {
    const accessToken = signAccessToken({ sub: "usr_existing", role: "client" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: accessToken })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "invalid refresh token" });
  });
});

test("POST /api/auth/refresh accepts valid refresh tokens", async () => {
  await withServer(async (baseUrl) => {
    const refreshToken = signRefreshToken({ sub: "usr_existing", role: "client" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_existing");
    assert.equal(decoded.role, "client");
  });
});

test("POST /api/auth/login returns access and refresh tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "client@example.com", password: "password123" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof payload.data.token, "string");
    assert.equal(typeof payload.data.refreshToken, "string");
  });
});
