import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { refreshToken } from "../services/authService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("refreshToken service preserves user sub and role", async () => {
  const user = { sub: "usr_alice123", role: "freelancer" };
  const result = await refreshToken(user);
  assert.ok(result.token);

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, user.sub);
  assert.equal(decoded.role, user.role);
});

test("POST /api/auth/refresh rejects unauthenticated requests with 401", async () => {
  await withServer(async (baseUrl) => {
    // 1. Missing Authorization header
    const noAuthResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    assert.equal(noAuthResponse.status, 401);
    const noAuthBody = await noAuthResponse.json();
    assert.deepEqual(noAuthBody, {
      success: false,
      message: "Unauthorized"
    });

    // 2. Invalid Bearer token
    const invalidResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: "Bearer invalid.token.value" }
    });
    assert.equal(invalidResponse.status, 401);
    const invalidBody = await invalidResponse.json();
    assert.deepEqual(invalidBody, {
      success: false,
      message: "Invalid token"
    });
  });
});

test("POST /api/auth/refresh returns fresh token preserving authenticated caller identity", async () => {
  await withServer(async (baseUrl) => {
    const originalClaims = { sub: "usr_bob789", role: "admin" };
    const initialToken = signAccessToken(originalClaims);

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${initialToken}` }
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.data.token);

    const refreshedClaims = verifyAccessToken(body.data.token);
    assert.equal(refreshedClaims.sub, originalClaims.sub);
    assert.equal(refreshedClaims.role, originalClaims.role);
  });
});
