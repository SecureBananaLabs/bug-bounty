import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function requestMetrics(baseUrl, authorization) {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: authorization ? { authorization } : {}
  });

  return { response, payload: await response.json() };
}

test("auth middleware accepts canonical Bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const { response, payload } = await requestMetrics(baseUrl, `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("auth middleware accepts lowercase bearer scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const { response, payload } = await requestMetrics(baseUrl, `bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("auth middleware accepts uppercase BEARER scheme", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const { response, payload } = await requestMetrics(baseUrl, `BEARER ${token}`);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("auth middleware rejects malformed authorization headers", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await requestMetrics(baseUrl, "Token abc123");

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});
