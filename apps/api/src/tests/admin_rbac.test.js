import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Admin RBAC Access Control Guard", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("GET /api/admin/metrics returns 401 when Authorization header is missing", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("GET /api/admin/metrics returns 401 when token is invalid", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: "Bearer invalid.token.payload" }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("GET /api/admin/metrics returns 403 Forbidden when caller role is not admin", async () => {
    const userToken = signAccessToken({ sub: "usr_freelancer123", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden: Admin privileges required");
  });

  await t.test("GET /api/admin/metrics returns 200 OK when caller has admin role", async () => {
    const adminToken = signAccessToken({ sub: "usr_admin999", role: "admin" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.openJobs !== undefined);
    assert.ok(body.data.activeFreelancers !== undefined);
    assert.ok(body.data.monthlyVolume !== undefined);
  });
});
