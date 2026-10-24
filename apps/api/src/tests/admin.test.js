import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function makeRequest(path, headers = {}) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers });
    const data = await res.json();
    return { status: res.status, data };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/admin/metrics without Authorization header returns 401", async () => {
  const { status, data } = await makeRequest("/api/admin/metrics");
  assert.equal(status, 401);
  assert.equal(data.success, false);
  assert.equal(data.message, "Unauthorized");
});

test("GET /api/admin/metrics with malformed/invalid token returns 401", async () => {
  const { status, data } = await makeRequest("/api/admin/metrics", {
    Authorization: "Bearer invalid.fake.token"
  });
  assert.equal(status, 401);
  assert.equal(data.success, false);
  assert.equal(data.message, "Invalid token");
});

test("GET /api/admin/metrics with client role returns 403 Forbidden", async () => {
  const token = signAccessToken({ id: "usr_client_1", role: "client" });
  const { status, data } = await makeRequest("/api/admin/metrics", {
    Authorization: `Bearer ${token}`
  });
  assert.equal(status, 403);
  assert.equal(data.success, false);
  assert.equal(data.message, "Forbidden: admin role required");
});

test("GET /api/admin/metrics with freelancer role returns 403 Forbidden", async () => {
  const token = signAccessToken({ id: "usr_free_1", role: "freelancer" });
  const { status, data } = await makeRequest("/api/admin/metrics", {
    Authorization: `Bearer ${token}`
  });
  assert.equal(status, 403);
  assert.equal(data.success, false);
  assert.equal(data.message, "Forbidden: admin role required");
});

test("GET /api/admin/metrics with admin role returns 200 and metrics payload", async () => {
  const token = signAccessToken({ id: "usr_admin_1", role: "admin" });
  const { status, data } = await makeRequest("/api/admin/metrics", {
    Authorization: `Bearer ${token}`
  });
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.openJobs, 42);
  assert.equal(data.data.activeFreelancers, 185);
  assert.equal(data.data.flaggedAccounts, 3);
  assert.equal(data.data.monthlyVolume, 128900);
});
