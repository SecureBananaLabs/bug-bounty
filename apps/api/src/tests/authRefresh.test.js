import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

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

async function postRefresh(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/refresh rejects missing refreshToken", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.path.includes("refreshToken")));
  });
});

test("POST /api/auth/refresh rejects invalid refreshToken", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRefresh(baseUrl, { refreshToken: "not-a-token" });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid token"
    });
  });
});

test("POST /api/auth/refresh issues a token for verified refreshToken payload", async () => {
  await withServer(async (baseUrl) => {
    const refreshToken = signAccessToken({ sub: "usr_123", role: "freelancer" });
    const response = await postRefresh(baseUrl, { refreshToken });
    const payload = await response.json();
    const decoded = jwt.verify(payload.data.token, env.jwtSecret);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(decoded.sub, "usr_123");
    assert.equal(decoded.role, "freelancer");
  });
});
