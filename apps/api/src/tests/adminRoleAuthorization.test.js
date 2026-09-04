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

async function getMetrics(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${baseUrl}/api/admin/metrics`, { headers });
}

test("GET /api/admin/metrics rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await getMetrics(baseUrl);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/admin/metrics rejects non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await getMetrics(baseUrl, token);
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(body, { success: false, message: "Forbidden" });
  });
});

test("GET /api/admin/metrics allows admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await getMetrics(baseUrl, token);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.openJobs, 42);
    assert.equal(body.data.flaggedAccounts, 3);
  });
});
