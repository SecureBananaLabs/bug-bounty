import assert from "node:assert/strict";
import { test } from "node:test";
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
    await callback(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getMetrics(port, token) {
  return fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

test("auth middleware rejects string JWT payloads", async () => {
  await withServer(async (port) => {
    const token = jwt.sign("usr_123", env.jwtSecret);
    const response = await getMetrics(port, token);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid token"
    });
  });
});

test("auth middleware rejects tokens without a subject", async () => {
  await withServer(async (port) => {
    const token = jwt.sign({ role: "client" }, env.jwtSecret);
    const response = await getMetrics(port, token);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid token"
    });
  });
});

test("auth middleware rejects unsupported roles", async () => {
  await withServer(async (port) => {
    const token = jwt.sign({ sub: "usr_123", role: "owner" }, env.jwtSecret);
    const response = await getMetrics(port, token);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid token"
    });
  });
});

test("auth middleware preserves valid access tokens", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_123", role: "admin" });
    const response = await getMetrics(port, token);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
  });
});
