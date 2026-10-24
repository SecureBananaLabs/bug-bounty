import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/admin/metrics without Authorization header rejects with 401 Unauthorized", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });
});

test("GET /api/admin/metrics with malformed Authorization header rejects with 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: "Basic invalid_credentials" }
    });
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Unauthorized");
  });
});

test("GET /api/admin/metrics with invalid JWT token rejects with 401 Invalid token", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: "Bearer bogus.jwt.token" }
    });
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid token");
  });
});

test("GET /api/admin/metrics with client role token rejects with 403 Forbidden (RBAC Guard)", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "usr_client_001", role: "client" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const data = await res.json();

    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.match(data.message, /Admin access required/i);
  });
});

test("GET /api/admin/metrics with freelancer role token rejects with 403 Forbidden (RBAC Guard)", async () => {
  await withServer(async (baseUrl) => {
    const freelancerToken = signAccessToken({ sub: "usr_freelance_002", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${freelancerToken}` }
    });
    const data = await res.json();

    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.match(data.message, /Admin access required/i);
  });
});

test("GET /api/admin/metrics with valid admin role token returns 200 OK and metrics payload", async () => {
  await withServer(async (baseUrl) => {
    const adminToken = signAccessToken({ sub: "usr_admin_root", role: "admin" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data);
    assert.equal(typeof data.data.openJobs, "number");
    assert.equal(typeof data.data.activeFreelancers, "number");
    assert.equal(typeof data.data.monthlyVolume, "number");
  });
});
