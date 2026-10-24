import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function getMetrics(headers) {
  const app = createApp();
  const server = app.listen(0);
  await listen(server);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers
    });
    const payload = await response.json();
    return { status: response.status, payload };
  } finally {
    await close(server);
  }
}

test("GET /api/admin/metrics without a token is 401", async () => {
  const { status, payload } = await getMetrics();
  assert.equal(status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });
});

test("GET /api/admin/metrics with a bad token is 401", async () => {
  const { status, payload } = await getMetrics({
    authorization: "Bearer not-a-token"
  });
  assert.equal(status, 401);
  assert.deepEqual(payload, { success: false, message: "Invalid token" });
});

test("GET /api/admin/metrics rejects a client token", async () => {
  const token = signAccessToken({ sub: "usr_client", role: "client" });
  const { status, payload } = await getMetrics({
    authorization: `Bearer ${token}`
  });
  assert.equal(status, 403);
  assert.deepEqual(payload, { success: false, message: "Forbidden" });
});

test("GET /api/admin/metrics rejects a freelancer token", async () => {
  const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
  const { status, payload } = await getMetrics({
    authorization: `Bearer ${token}`
  });
  assert.equal(status, 403);
  assert.equal(payload.message, "Forbidden");
  assert.equal(payload.data, undefined);
});

test("GET /api/admin/metrics rejects a token with no role", async () => {
  const token = signAccessToken({ sub: "usr_norole" });
  const { status, payload } = await getMetrics({
    authorization: `Bearer ${token}`
  });
  assert.equal(status, 403);
  assert.equal(payload.data, undefined);
});

test("GET /api/admin/metrics rejects a lookalike admin role", async () => {
  const token = signAccessToken({ sub: "usr_lookalike", role: "Admin" });
  const { status } = await getMetrics({
    authorization: `Bearer ${token}`
  });
  assert.equal(status, 403);
});

test("GET /api/admin/metrics returns metrics for an admin token", async () => {
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  const { status, payload } = await getMetrics({
    authorization: `Bearer ${token}`
  });
  assert.equal(status, 200);
  assert.equal(payload.success, true);
  assert.equal(typeof payload.data.openJobs, "number");
  assert.equal(typeof payload.data.flaggedAccounts, "number");
  assert.equal(typeof payload.data.monthlyVolume, "number");
});
