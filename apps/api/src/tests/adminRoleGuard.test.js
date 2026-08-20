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

async function getMetrics(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers });
  return {
    response,
    payload: await response.json()
  };
}

test("GET /api/admin/metrics still rejects anonymous callers", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getMetrics(baseUrl);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/admin/metrics rejects non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const { response, payload } = await getMetrics(baseUrl, clientToken);

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Forbidden"
    });
  });
});

test("GET /api/admin/metrics allows admin users", async () => {
  await withServer(async (baseUrl) => {
    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const { response, payload } = await getMetrics(baseUrl, adminToken);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
  });
});
