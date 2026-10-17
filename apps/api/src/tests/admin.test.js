import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { _resetAdminStateForTests } from "../services/adminService.js";

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
    authorization: `Bearer ${signAccessToken({ sub: "admin_001", role: "admin" })}`,
    "content-type": "application/json"
  };
}

function clientHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "client_001", role: "client" })}`,
    "content-type": "application/json"
  };
}

test("admin API rejects unauthenticated and non-admin callers", async () => {
  _resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(unauthenticated.status, 401);

    const forbidden = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: clientHeaders()
    });
    assert.equal(forbidden.status, 403);
  });
});

test("admin overview exposes metrics, trust distribution, and platform controls", async () => {
  _resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.summary.totalUsers, 4);
    assert.equal(payload.data.summary.flaggedListings, 2);
    assert.equal(payload.data.trustDistribution.length, 3);
    assert.equal(payload.data.controls.registrationsEnabled, true);
  });
});

test("admin user list supports server-side pagination and filters", async () => {
  _resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&pageSize=1`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.total, 2);
    assert.equal(payload.data.totalPages, 2);
    assert.equal(payload.data.items[0].role, "freelancer");
  });
});

test("admin actions mutate state and append audit records", async () => {
  _resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const action = await fetch(`${baseUrl}/api/admin/users/usr_freelancer_002/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Risk review" })
    });
    const actionPayload = await action.json();

    assert.equal(action.status, 200);
    assert.equal(actionPayload.data.user.status, "suspended");
    assert.equal(actionPayload.data.audit.actionType, "user.suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit?actionType=user.suspended`, {
      headers: adminHeaders()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.total, 1);
    assert.equal(auditPayload.data.items[0].targetId, "usr_freelancer_002");
  });
});

test("admin can moderate listings, rule disputes, and update platform controls", async () => {
  _resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const moderation = await fetch(`${baseUrl}/api/admin/moderation/job_101`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "External payment request" })
    });
    const moderationPayload = await moderation.json();
    assert.equal(moderation.status, 200);
    assert.equal(moderationPayload.data.job.moderationStatus, "rejected");
    assert.equal(moderationPayload.data.notification.userId, "usr_client_001");
    assert.match(
      moderationPayload.data.notification.message,
      /External payment request/
    );

    const ruling = await fetch(`${baseUrl}/api/admin/disputes/dsp_300/ruling`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "Missing source files" })
    });
    const rulingPayload = await ruling.json();
    assert.equal(ruling.status, 200);
    assert.equal(rulingPayload.data.dispute.status, "resolved");
    assert.equal(rulingPayload.data.dispute.ruling, "refund");
    assert.deepEqual(
      rulingPayload.data.notifications.map((item) => item.userId),
      ["usr_client_001", "usr_freelancer_002"]
    );

    const control = await fetch(`${baseUrl}/api/admin/controls`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ key: "jobPostingEnabled", enabled: false })
    });
    const controlPayload = await control.json();
    assert.equal(control.status, 200);
    assert.equal(controlPayload.data.controls.jobPostingEnabled, false);
  });
});
