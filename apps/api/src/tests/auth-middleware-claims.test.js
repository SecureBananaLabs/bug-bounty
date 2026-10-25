import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

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

async function getAdminMetrics(baseUrl, token) {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { response, payload: await response.json() };
}

test("authMiddleware accepts valid identity claims", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const { response, payload } = await getAdminMetrics(baseUrl, token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("authMiddleware rejects tokens missing sub", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ role: "client" });
    const { response, payload } = await getAdminMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token claims");
  });
});

test("authMiddleware rejects blank sub claims", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "   ", role: "client" });
    const { response, payload } = await getAdminMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token claims");
  });
});

test("authMiddleware rejects unsupported roles", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "owner" });
    const { response, payload } = await getAdminMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token claims");
  });
});

test("authMiddleware rejects non-object JWT payloads", async () => {
  await withServer(async (baseUrl) => {
    const token = jwt.sign("usr_1", env.jwtSecret);
    const { response, payload } = await getAdminMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token claims");
  });
});
