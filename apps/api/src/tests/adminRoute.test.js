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
    return await callback(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/admin/metrics returns 401 with no token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("GET /api/admin/metrics returns 401 with an invalid token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: "Bearer not-a-jwt" }
    });
    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("GET /api/admin/metrics returns 403 for a non-admin token", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });
});

test("GET /api/admin/metrics returns 403 for an admin token missing the role claim", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_2" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("GET /api/admin/metrics returns 200 for an admin token", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.openJobs, "number");
  });
});
