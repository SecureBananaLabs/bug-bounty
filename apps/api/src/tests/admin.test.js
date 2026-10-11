import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "admin_test", role: "admin" })}`,
    "content-type": "application/json"
  };
}

test("admin routes require an admin token", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(anonymous.status, 401);

    const userToken = signAccessToken({ sub: "user_test", role: "client" });
    const forbidden = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${userToken}` }
    });
    assert.equal(forbidden.status, 403);
  });
});

test("admin overview exposes metrics, controls, and audit entries", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.metrics.totalUsers, 4);
    assert.equal(payload.data.controls.length, 2);
    assert.ok(Array.isArray(payload.data.latestAudit));
  });
});

test("admin can paginate users and write action audit entries", async () => {
  await withServer(async (baseUrl) => {
    const users = await fetch(`${baseUrl}/api/admin/users?pageSize=2&role=freelancer`, {
      headers: adminHeaders()
    });
    const usersPayload = await users.json();
    assert.equal(users.status, 200);
    assert.equal(usersPayload.data.pageSize, 2);
    assert.equal(usersPayload.data.items.every((user) => user.role === "freelancer"), true);

    const status = await fetch(`${baseUrl}/api/admin/users/usr_1002/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "manual review" })
    });
    const statusPayload = await status.json();
    assert.equal(status.status, 200);
    assert.equal(statusPayload.data.user.status, "suspended");
    assert.equal(statusPayload.data.audit.actionType, "user.status_updated");
  });
});

test("admin actions moderate listings, resolve disputes, and update controls", async () => {
  await withServer(async (baseUrl) => {
    const moderation = await fetch(`${baseUrl}/api/admin/moderation/job_2001/decision`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ decision: "rejected", reason: "private data scraping" })
    });
    const moderationPayload = await moderation.json();
    assert.equal(moderation.status, 200);
    assert.equal(moderationPayload.data.job.status, "rejected");
    assert.equal(moderationPayload.data.notification.userId, "usr_1004");

    const dispute = await fetch(`${baseUrl}/api/admin/disputes/dsp_3001/ruling`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "client", note: "refund evidence accepted" })
    });
    const disputePayload = await dispute.json();
    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");
    assert.equal(disputePayload.data.refund.status, "queued");
    assert.equal(disputePayload.data.notifications.length, 2);

    const control = await fetch(`${baseUrl}/api/admin/controls/jobPostings`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    const controlPayload = await control.json();
    assert.equal(control.status, 200);
    assert.equal(controlPayload.data.control.enabled, false);

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?actionType=control.updated`, {
      headers: adminHeaders()
    });
    const auditPayload = await audit.json();
    assert.equal(audit.status, 200);
    assert.ok(auditPayload.data.items.length >= 1);

    const rangedAudit = await fetch(
      `${baseUrl}/api/admin/audit-log?adminId=admin_test&from=2026-01-01&to=2099-01-01`,
      { headers: adminHeaders() }
    );
    const rangedAuditPayload = await rangedAudit.json();
    assert.equal(rangedAudit.status, 200);
    assert.ok(rangedAuditPayload.data.items.every((entry) => entry.adminId === "admin_test"));
  });
});
