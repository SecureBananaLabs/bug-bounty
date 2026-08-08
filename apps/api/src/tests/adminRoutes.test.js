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
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function request(baseUrl, path, token, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  return { response, payload: await response.json() };
}

test("admin routes enforce admin role and support core operations", async () => {
  const { baseUrl, close } = await startServer();
  const adminToken = signAccessToken({ sub: "usr_admin_test", role: "admin" });
  const clientToken = signAccessToken({ sub: "usr_client_test", role: "client" });

  try {
    const unauthorized = await request(baseUrl, "/api/admin/metrics", null);
    assert.equal(unauthorized.response.status, 401);

    const forbidden = await request(baseUrl, "/api/admin/metrics", clientToken);
    assert.equal(forbidden.response.status, 403);
    assert.equal(forbidden.payload.message, "Admin access required");

    const metrics = await request(baseUrl, "/api/admin/metrics", adminToken);
    assert.equal(metrics.response.status, 200);
    assert.equal(metrics.payload.data.totalUsers, 4);
    assert.equal(metrics.payload.data.openDisputes, 2);
    assert.equal(metrics.payload.data.trustDistribution.length, 3);

    const users = await request(baseUrl, "/api/admin/users?role=client&status=active&pageSize=1", adminToken);
    assert.equal(users.response.status, 200);
    assert.equal(users.payload.data.items.length, 1);
    assert.equal(users.payload.data.items[0].role, "client");
    assert.equal(users.payload.data.total, 1);

    const detail = await request(baseUrl, "/api/admin/users/usr_client_1", adminToken);
    assert.equal(detail.response.status, 200);
    assert.equal(detail.payload.data.disputeHistory.length, 1);

    const statusUpdate = await request(baseUrl, "/api/admin/users/usr_client_1/status", adminToken, {
      method: "POST",
      body: JSON.stringify({ status: "suspended" })
    });
    assert.equal(statusUpdate.response.status, 200);
    assert.equal(statusUpdate.payload.data.status, "suspended");

    const moderation = await request(baseUrl, "/api/admin/moderation/jobs/job_101", adminToken, {
      method: "POST",
      body: JSON.stringify({ action: "reject", reason: "Scope does not match listed budget" })
    });
    assert.equal(moderation.response.status, 200);
    assert.equal(moderation.payload.data.status, "rejected");

    const ruling = await request(baseUrl, "/api/admin/disputes/dsp_1/ruling", adminToken, {
      method: "POST",
      body: JSON.stringify({ ruling: "freelancer" })
    });
    assert.equal(ruling.response.status, 200);
    assert.equal(ruling.payload.data.status, "resolved");

    const controls = await request(baseUrl, "/api/admin/controls", adminToken, {
      method: "POST",
      body: JSON.stringify({ control: "jobPostingEnabled", enabled: false })
    });
    assert.equal(controls.response.status, 200);
    assert.equal(controls.payload.data.jobPostingEnabled, false);

    const audit = await request(baseUrl, "/api/admin/audit-log?actionType=control", adminToken);
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items.length, 1);
    assert.equal(audit.payload.data.items[0].adminId, "usr_admin_test");

    const notifications = await request(baseUrl, "/api/admin/notifications", adminToken);
    assert.equal(notifications.response.status, 200);
    assert.ok(notifications.payload.data.some((item) => item.message.includes("rejected")));

    const invalidAction = await request(baseUrl, "/api/admin/moderation/jobs/job_101", adminToken, {
      method: "POST",
      body: JSON.stringify({ action: "archive" })
    });
    assert.equal(invalidAction.response.status, 400);
    assert.match(invalidAction.payload.message, /action must be one of/);
  } finally {
    await close();
  }
});
