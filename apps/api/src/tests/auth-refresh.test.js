import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postRefresh(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Refresh token is required"
    });
  });
});

test("POST /api/auth/refresh rejects blank token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { token: "   " });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Refresh token is required"
    });
  });
});

test("POST /api/auth/refresh rejects invalid token", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { token: "not-a-jwt" });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid refresh token"
    });
  });
});

test("POST /api/auth/refresh mints replacement token for verified token", async () => {
  await withServer(async (baseUrl) => {
    const refreshToken = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
    const response = await postRefresh(baseUrl, { token: refreshToken });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");

    const verified = verifyAccessToken(payload.data.token);
    assert.equal(verified.sub, "usr_refresh");
    assert.equal(verified.role, "freelancer");
  });
});

test("POST /api/auth/refresh rejects expired verified-shape token", async () => {
  await withServer(async (baseUrl) => {
    const expiredToken = jwt.sign(
      { sub: "usr_expired", role: "client", exp: Math.floor(Date.now() / 1000) - 60 },
      env.jwtSecret
    );
    const response = await postRefresh(baseUrl, { token: expiredToken });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid refresh token"
    });
  });
});
