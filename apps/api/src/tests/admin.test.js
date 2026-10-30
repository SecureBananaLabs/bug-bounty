import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

const get = (base, token, headers = {}) =>
  fetch(`${base}/api/admin/metrics`, {
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

test("non-admin (client) token is rejected from /api/admin/metrics with 403", async () => {
  const { base, stop } = await startServer();
  try {
    const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });
    const response = await get(base, clientToken);
    assert.equal(response.status, 403);
  } finally {
    await stop();
  }
});

test("admin token can still reach /api/admin/metrics (200)", async () => {
  const { base, stop } = await startServer();
  try {
    const adminToken = signAccessToken({ sub: "usr_admin_1", role: "admin" });
    const response = await get(base, adminToken);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
  } finally {
    await stop();
  }
});

test("missing token is still rejected with 401", async () => {
  const { base, stop } = await startServer();
  try {
    const response = await get(base, null);
    assert.equal(response.status, 401);
  } finally {
    await stop();
  }
});
