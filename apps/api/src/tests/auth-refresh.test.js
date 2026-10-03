import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("POST /api/auth/refresh rejects requests without a bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { success: false, message: "Unauthorized" });
  });
});

test("POST /api/auth/refresh rejects invalid and expired tokens", async () => {
  await withServer(async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: "Bearer not-a-valid-token" }
    });
    assert.equal(invalid.status, 401);
    assert.deepEqual(await invalid.json(), { success: false, message: "Invalid token" });

    const expiredToken = jwt.sign(
      { sub: "usr_expired", role: "freelancer" },
      env.jwtSecret,
      { expiresIn: -1 }
    );
    const expired = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(expired.status, 401);
    assert.deepEqual(await expired.json(), { success: false, message: "Invalid token" });
  });
});

test("POST /api/auth/refresh preserves authenticated subject and role", async () => {
  await withServer(async (baseUrl) => {
    const originalToken = signAccessToken({ sub: "usr_123", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { authorization: `Bearer ${originalToken}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    const refreshed = verifyAccessToken(payload.data.token);
    assert.equal(refreshed.sub, "usr_123");
    assert.equal(refreshed.role, "freelancer");
  });
});
