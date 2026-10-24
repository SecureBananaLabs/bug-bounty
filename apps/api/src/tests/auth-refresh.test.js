import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withApi(run) {
  const server = createApp().listen(0);

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

async function refresh(baseUrl, token) {
  const headers = token === undefined ? {} : { Authorization: `Bearer ${token}` };
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers,
  });

  return { response, body: await response.json() };
}

test("refresh rejects a missing bearer token", async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await refresh(baseUrl);

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Unauthorized" });
  });
});

test("refresh rejects a token signed with the wrong secret", async () => {
  const wrongSecret = randomBytes(32).toString("hex");
  const forged = jwt.sign(
    { sub: "usr_attacker", role: "admin" },
    wrongSecret,
    { expiresIn: "15m" }
  );

  await withApi(async (baseUrl) => {
    const { response, body } = await refresh(baseUrl, forged);

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("refresh rejects an expired token", async () => {
  const expired = jwt.sign(
    { sub: "usr_expired", role: "client" },
    env.jwtSecret,
    { expiresIn: -1 }
  );

  await withApi(async (baseUrl) => {
    const { response, body } = await refresh(baseUrl, expired);

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("refresh preserves verified identity and mints fresh temporal claims", async () => {
  const original = signAccessToken({ sub: "usr_verified", role: "freelancer" });
  const originalPayload = verifyAccessToken(original);

  await withApi(async (baseUrl) => {
    const { response, body } = await refresh(baseUrl, original);

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(typeof body.data?.token, "string");

    const refreshedPayload = verifyAccessToken(body.data.token);
    assert.equal(refreshedPayload.sub, "usr_verified");
    assert.equal(refreshedPayload.role, "freelancer");
    assert.equal(typeof refreshedPayload.iat, "number");
    assert.equal(typeof refreshedPayload.exp, "number");
    assert.ok(refreshedPayload.exp > refreshedPayload.iat);
    assert.equal(refreshedPayload.exp - refreshedPayload.iat, 15 * 60);

    // The service signs a fresh payload instead of forwarding verified JWT metadata.
    assert.deepEqual(
      Object.keys(refreshedPayload).sort(),
      ["exp", "iat", "role", "sub"].sort()
    );
    assert.equal(originalPayload.sub, refreshedPayload.sub);
  });
});
