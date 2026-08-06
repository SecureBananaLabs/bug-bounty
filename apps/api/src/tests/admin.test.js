import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Admin metrics access control", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/admin/metrics`;

  await t.test("GET /api/admin/metrics without auth token returns 401", async () => {
    const response = await fetch(baseUrl);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });

  await t.test("GET /api/admin/metrics with invalid auth token returns 401", async () => {
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: "Bearer invalid_token"
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  });

  await t.test("GET /api/admin/metrics with client role token returns 403 Forbidden", async () => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });

  await t.test("GET /api/admin/metrics with freelancer role token returns 403 Forbidden", async () => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });

  await t.test("GET /api/admin/metrics with admin role token returns 200 and metrics payload", async () => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.openJobs, "number");
    assert.equal(typeof payload.data.activeFreelancers, "number");
    assert.equal(typeof payload.data.flaggedAccounts, "number");
    assert.equal(typeof payload.data.monthlyVolume, "number");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
