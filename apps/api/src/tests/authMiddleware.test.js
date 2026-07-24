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

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function signedToken(payload) {
  return jwt.sign(payload, env.jwtSecret);
}

async function getAdminMetrics(baseUrl, token) {
  return fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function assertUnauthorized(baseUrl, token) {
  const response = await getAdminMetrics(baseUrl, token);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Invalid token" });
}

test("auth middleware rejects signed tokens with string payloads", async () => {
  await withServer(async (baseUrl) => {
    await assertUnauthorized(baseUrl, signedToken("usr_1"));
  });
});

test("auth middleware rejects signed tokens missing sub", async () => {
  await withServer(async (baseUrl) => {
    await assertUnauthorized(baseUrl, signedToken({ role: "client" }));
  });
});

test("auth middleware rejects signed tokens with blank sub", async () => {
  await withServer(async (baseUrl) => {
    await assertUnauthorized(baseUrl, signedToken({ sub: "   ", role: "client" }));
  });
});

test("auth middleware rejects signed tokens with unsupported role", async () => {
  await withServer(async (baseUrl) => {
    await assertUnauthorized(baseUrl, signedToken({ sub: "usr_1", role: "owner" }));
  });
});

test("auth middleware accepts valid app-issued access tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const response = await getAdminMetrics(baseUrl, token);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.openJobs, "number");
  });
});
