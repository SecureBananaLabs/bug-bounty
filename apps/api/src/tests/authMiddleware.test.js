import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
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

async function requestAdminMetrics(baseUrl, authorization) {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: authorization ? { Authorization: authorization } : {}
  });
  const payload = await response.json();
  return { response, payload };
}

test("authMiddleware accepts canonical bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "admin" });
    const { response, payload } = await requestAdminMetrics(baseUrl, `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("authMiddleware accepts lowercase bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "admin" });
    const { response, payload } = await requestAdminMetrics(baseUrl, `bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("authMiddleware accepts uppercase bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "admin" });
    const { response, payload } = await requestAdminMetrics(baseUrl, `BEARER ${token}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("authMiddleware rejects missing token after bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await requestAdminMetrics(baseUrl, "Bearer");

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authMiddleware rejects malformed auth scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "admin" });
    const { response, payload } = await requestAdminMetrics(baseUrl, `Token ${token}`);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authMiddleware still rejects invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await requestAdminMetrics(baseUrl, "bearer invalid-token");

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });
});
