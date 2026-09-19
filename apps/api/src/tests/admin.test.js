import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const adminToken = signAccessToken({ sub: "admin_001", role: "admin" });
const clientToken = signAccessToken({ sub: "usr_002", role: "client" });

test("admin routes require an authenticated admin token", async () => {
  await withServer(async (baseUrl) => {
    const anonymousResponse = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(anonymousResponse.status, 401);

    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` }
    });
    assert.equal(clientResponse.status, 403);

    const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: adminHeaders()
    });
    const payload = await adminResponse.json();

    assert.equal(adminResponse.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 5);
    assert.equal(payload.data.openDisputes, 2);
    assert.equal(payload.data.controls.length, 2);
  });
});

test("admins can page and filter user records", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=client&page=1&pageSize=1`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].role, "client");
    assert.equal(payload.data.pagination.total, 2);
    assert.equal(payload.data.pagination.pageSize, 1);
  });
});

test("admin user status actions write append-only audit entries", async () => {
  await withServer(async (baseUrl) => {
    const updateResponse = await fetch(`${baseUrl}/api/admin/users/usr_002/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "KYC review failed" })
    });
    const updatePayload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updatePayload.data.user.status, "suspended");
    assert.equal(updatePayload.data.audit.actionType, "admin.user.status_changed");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?targetId=usr_002`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_002");
    assert.equal(auditPayload.data.items[0].metadata.reason, "KYC review failed");
  });
});

test("admin moderation, dispute, and platform controls are auditable", async () => {
  await withServer(async (baseUrl) => {
    const moderationResponse = await fetch(`${baseUrl}/api/admin/moderation/job_flag_001`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ decision: "reject", reason: "Violates marketplace policy" })
    });
    const moderationPayload = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.equal(moderationPayload.data.listing.status, "rejected");

    const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_001`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "Evidence favors refund" })
    });
    const disputePayload = await disputeResponse.json();

    assert.equal(disputeResponse.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");

    const controlResponse = await fetch(`${baseUrl}/api/admin/controls/newJobPostings`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false, reason: "Abuse spike" })
    });
    const controlPayload = await controlResponse.json();

    assert.equal(controlResponse.status, 200);
    assert.equal(controlPayload.data.control.enabled, false);

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?actionType=admin.control.updated`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditPayload.data.items[0].targetId, "newJobPostings");
    assert.equal(auditPayload.data.items[0].metadata.reason, "Abuse spike");
  });
});

function adminHeaders() {
  return {
    authorization: `Bearer ${adminToken}`,
    "content-type": "application/json"
  };
}

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
