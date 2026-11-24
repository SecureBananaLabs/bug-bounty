import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { resetAdminState } from "../services/adminService.js";
import { signAccessToken } from "../utils/jwt.js";

beforeEach(() => {
  resetAdminState();
});

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

function token(role = "admin", sub = "admin_test") {
  return signAccessToken({ sub, role });
}

function authHeaders(role = "admin") {
  return {
    Authorization: `Bearer ${token(role)}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject non-admin users server-side", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Admin access required" });
  });
});

test("admin metrics include platform health and trust score distribution", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 4);
    assert.equal(payload.data.flaggedListings, 2);
    assert.equal(payload.data.platformHealth.api, "operational");
    assert.equal(payload.data.trustScoreDistribution.length, 4);
  });
});

test("admin user list supports role/status search and server-side pagination", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/admin/users?role=client&status=active&page=1&pageSize=1&search=avery`,
      { headers: authHeaders() }
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.page, 1);
    assert.equal(payload.data.pageSize, 1);
    assert.equal(payload.data.total, 1);
    assert.equal(payload.data.items[0].email, "avery@example.com");
  });
});

test("admin can suspend a user and append an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_freelancer_204/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "suspend", reason: "Risk review" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.user.status, "suspended");
    assert.equal(payload.data.audit.actionType, "user_suspend");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?actionType=user_suspend`, {
      headers: authHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditPayload.data.total, 1);
    assert.equal(auditPayload.data.items[0].targetId, "usr_freelancer_204");
  });
});

test("rejecting a flagged job records a notification and audit event", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/jobs/moderation/mod_job_902`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Prohibited scraping request" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.job.status, "rejected");
    assert.equal(payload.data.notification.toUserId, "usr_client_188");
    assert.match(payload.data.notification.message, /rejected/);
    assert.equal(payload.data.audit.actionType, "job_reject");
  });
});

test("platform control changes require confirmation and are audited", async () => {
  await withServer(async (baseUrl) => {
    const blocked = await fetch(`${baseUrl}/api/admin/controls`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ registrationsEnabled: false })
    });
    const blockedPayload = await blocked.json();

    assert.equal(blocked.status, 409);
    assert.equal(blockedPayload.message, "Control changes require confirmation");

    const response = await fetch(`${baseUrl}/api/admin/controls`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ registrationsEnabled: false, confirmed: true })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.controls.registrationsEnabled, false);
    assert.equal(payload.data.audit.actionType, "platform_controls_update");
  });
});

test("admin can rule on a dispute and notify both parties", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/disputes/dsp_escrow_copy/ruling`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "refund", note: "Brief mismatch validated" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.dispute.status, "resolved");
    assert.equal(payload.data.dispute.ruling, "refund");
    assert.equal(payload.data.dispute.notifications.length, 2);
    assert.equal(payload.data.audit.actionType, "dispute_refund");
  });
});
