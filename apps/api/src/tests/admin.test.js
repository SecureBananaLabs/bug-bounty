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

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function apiRequest(baseUrl, path, { token, method = "GET", body } = {}) {
  const headers = {};

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (body) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return { response, payload: await response.json() };
}

test("admin routes reject missing or non-admin credentials", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });

    const noAuth = await apiRequest(baseUrl, "/api/admin/metrics");
    assert.equal(noAuth.response.status, 401);
    assert.deepEqual(noAuth.payload, { success: false, message: "Unauthorized" });

    const notAdmin = await apiRequest(baseUrl, "/api/admin/metrics", { token: clientToken });
    assert.equal(notAdmin.response.status, 403);
    assert.deepEqual(notAdmin.payload, { success: false, message: "Forbidden" });
  });
});

test("admin routes support user, moderation, dispute, control, and audit workflows", async () => {
  await withServer(async (baseUrl) => {
    const adminToken = signAccessToken({ sub: "adm_001", role: "admin" });

    const metrics = await apiRequest(baseUrl, "/api/admin/metrics", { token: adminToken });
    assert.equal(metrics.response.status, 200);
    assert.equal(metrics.payload.success, true);
    assert.equal(metrics.payload.data.totalUsers, 3);
    assert.deepEqual(metrics.payload.data.controls, {
      registrationsEnabled: true,
      jobPostingEnabled: true
    });

    const users = await apiRequest(baseUrl, "/api/admin/users?role=freelancer&pageSize=1", {
      token: adminToken
    });
    assert.equal(users.response.status, 200);
    assert.equal(users.payload.data.items.length, 1);
    assert.equal(users.payload.data.total, 2);

    const statusUpdate = await apiRequest(baseUrl, "/api/admin/users/usr_freelancer_1/status", {
      token: adminToken,
      method: "PATCH",
      body: { status: "suspended" }
    });
    assert.equal(statusUpdate.response.status, 200);
    assert.equal(statusUpdate.payload.data.status, "suspended");

    const moderation = await apiRequest(baseUrl, "/api/admin/moderation/flag_101/decision", {
      token: adminToken,
      method: "POST",
      body: { decision: "rejected", reason: "Off-platform payment terms" }
    });
    assert.equal(moderation.response.status, 200);
    assert.equal(moderation.payload.data.status, "rejected");

    const dispute = await apiRequest(baseUrl, "/api/admin/disputes/dsp_201/ruling", {
      token: adminToken,
      method: "POST",
      body: { ruling: "refund" }
    });
    assert.equal(dispute.response.status, 200);
    assert.equal(dispute.payload.data.status, "resolved");
    assert.equal(dispute.payload.data.ruling, "refund");

    const controls = await apiRequest(baseUrl, "/api/admin/controls/jobPostingEnabled", {
      token: adminToken,
      method: "PATCH",
      body: { enabled: false }
    });
    assert.equal(controls.response.status, 200);
    assert.equal(controls.payload.data.jobPostingEnabled, false);

    const audit = await apiRequest(baseUrl, "/api/admin/audit?action=user.suspended", {
      token: adminToken
    });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items.length, 1);
    assert.equal(audit.payload.data.items[0].adminId, "adm_001");
    assert.equal(audit.payload.data.items[0].targetId, "usr_freelancer_1");
  });
});
