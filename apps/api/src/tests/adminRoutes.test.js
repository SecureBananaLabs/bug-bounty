import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Admin routes role-based access control", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/admin/metrics`;
  const adminToken = signAccessToken({ sub: "admin-1", role: "admin" });
  const clientToken = signAccessToken({ sub: "client-1", role: "client" });
  const freelancerToken = signAccessToken({ sub: "freelancer-1", role: "freelancer" });

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  await t.test("GET /api/admin/metrics without auth header returns 401", async () => {
    const res = await fetch(baseUrl);
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("GET /api/admin/metrics with invalid token returns 401", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: "Bearer bad.token" }
    });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("GET /api/admin/metrics with client role returns 403 Forbidden", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden");
  });

  await t.test("GET /api/admin/metrics with freelancer role returns 403 Forbidden", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${freelancerToken}` }
    });
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden");
  });

  await t.test("GET /api/admin/metrics with admin role returns 200 OK", async () => {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data !== undefined);
  });
});
