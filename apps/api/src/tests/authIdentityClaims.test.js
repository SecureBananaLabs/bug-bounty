import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

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

async function requestMetrics(baseUrl, token) {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json();
  return { response, payload };
}

test("auth middleware rejects signed string JWT payloads", async () => {
  await withServer(async (baseUrl) => {
    const token = jwt.sign("usr_admin", env.jwtSecret);
    const { response, payload } = await requestMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });
});

test("auth middleware rejects JWTs missing sub", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ role: "admin" });
    const { response, payload } = await requestMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });
});

test("auth middleware rejects JWTs with unsupported roles", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "owner" });
    const { response, payload } = await requestMetrics(baseUrl, token);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });
});

test("auth middleware preserves valid app-issued access tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const { response, payload } = await requestMetrics(baseUrl, token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
  });
});
