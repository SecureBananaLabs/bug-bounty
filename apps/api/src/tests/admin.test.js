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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("admin routes reject non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin metrics and user moderation work for admins", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, { headers });
    const metricsPayload = await metricsResponse.json();
    assert.equal(metricsResponse.status, 200);
    assert.equal(metricsPayload.data.totalUsers, 3);

    const usersResponse = await fetch(`${baseUrl}/api/admin/users?role=client&pageSize=1`, { headers });
    const usersPayload = await usersResponse.json();
    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.pageSize, 1);
    assert.equal(usersPayload.data.items[0].role, "client");

    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_01/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "suspended" })
    });
    const statusPayload = await statusResponse.json();
    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.status, "suspended");
  });
});

test("admin moderation actions append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const moderationResponse = await fetch(`${baseUrl}/api/admin/flagged-jobs/job_flagged_01/moderate`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ decision: "rejected", reason: "Violates platform policy" })
    });
    const moderationPayload = await moderationResponse.json();
    assert.equal(moderationResponse.status, 200);
    assert.equal(moderationPayload.data.status, "rejected");
    assert.match(moderationPayload.data.notification, /Listing rejected/);

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=flagged_job_moderated`, { headers });
    const auditPayload = await auditResponse.json();
    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "job_flagged_01");
  });
});

test("admin routes return validation errors without leaking server failures", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const response = await fetch(`${baseUrl}/api/admin/users/usr_client_01/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "paused" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Invalid user status/);
  });
});
