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

function adminHeaders() {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: "admin_001", role: "admin" })}`,
    "Content-Type": "application/json"
  };
}

function userHeaders() {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: "usr_001", role: "client" })}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject non-admin users server-side", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: userHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });
});

test("admin metrics and users endpoint return paginated operations data", async () => {
  await withServer(async (baseUrl) => {
    const metrics = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: adminHeaders()
    });
    const metricsPayload = await metrics.json();

    assert.equal(metrics.status, 200);
    assert.equal(metricsPayload.data.totalUsers, 3);
    assert.equal(metricsPayload.data.openDisputes, 2);
    assert.equal(metricsPayload.data.flaggedListings, 2);

    const users = await fetch(`${baseUrl}/api/admin/users?role=freelancer&pageSize=1`, {
      headers: adminHeaders()
    });
    const usersPayload = await users.json();

    assert.equal(users.status, 200);
    assert.equal(usersPayload.data.total, 2);
    assert.equal(usersPayload.data.items.length, 1);
    assert.equal(usersPayload.data.items[0].role, "freelancer");
  });
});

test("admin user actions and moderation actions create audit entries", async () => {
  await withServer(async (baseUrl) => {
    const userAction = await fetch(`${baseUrl}/api/admin/users/usr_002/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended" })
    });
    const userPayload = await userAction.json();
    assert.equal(userAction.status, 200);
    assert.equal(userPayload.data.user.status, "suspended");
    assert.equal(userPayload.data.audit.action, "user_suspended");

    const moderationAction = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_001`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        action: "reject",
        reason: "Off-platform payment terms"
      })
    });
    const moderationPayload = await moderationAction.json();
    assert.equal(moderationAction.status, 200);
    assert.equal(moderationPayload.data.job.status, "rejected");
    assert.match(moderationPayload.data.job.notification, /Off-platform/);

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?pageSize=10`, {
      headers: adminHeaders()
    });
    const auditPayload = await audit.json();
    const actions = auditPayload.data.items.map((entry) => entry.action);
    assert.ok(actions.includes("user_suspended"));
    assert.ok(actions.includes("listing_reject"));
  });
});

test("admin can rule disputes and update platform controls", async () => {
  await withServer(async (baseUrl) => {
    const dispute = await fetch(`${baseUrl}/api/admin/disputes/dsp_001/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "freelancer", note: "Evidence accepted" })
    });
    const disputePayload = await dispute.json();
    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");
    assert.equal(disputePayload.data.dispute.ruling, "freelancer");

    const control = await fetch(`${baseUrl}/api/admin/controls/jobPostingEnabled`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    const controlPayload = await control.json();
    assert.equal(control.status, 200);
    assert.equal(controlPayload.data.controls.jobPostingEnabled, false);
    assert.equal(controlPayload.data.audit.action, "platform_control_updated");
  });
});
