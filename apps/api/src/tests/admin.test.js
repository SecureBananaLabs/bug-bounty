import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { resetAdminStateForTests } from "../services/adminService.js";
import { signAccessToken } from "../utils/jwt.js";

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

function adminHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "adm_1", role: "admin" })}`,
    "content-type": "application/json"
  };
}

function clientHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "usr_client", role: "client" })}`,
    "content-type": "application/json"
  };
}

test("admin routes require an authenticated admin token", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(anonymous.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/metrics`, { headers: clientHeaders() });
    assert.equal(client.status, 403);
  });
});

test("admin metrics include required summary and trust distribution", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers: adminHeaders() });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 5);
    assert.equal(payload.data.flaggedListings, 2);
    assert.deepEqual(
      payload.data.trustDistribution.map((bucket) => bucket.label),
      ["0-49", "50-69", "70-89", "90-100"]
    );
  });
});

test("admin user list is filtered and paginated server-side", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&pageSize=2`, { headers: adminHeaders() });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.items.length, 2);
    assert.equal(payload.data.pagination.total, 3);
    assert.ok(payload.data.items.every((user) => user.role === "freelancer"));
  });
});

test("admin user actions update status and append audit entries", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const action = await fetch(`${baseUrl}/api/admin/users/usr_1001/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Chargeback review" })
    });
    const actionPayload = await action.json();

    assert.equal(action.status, 200);
    assert.equal(actionPayload.data.user.status, "suspended");
    assert.equal(actionPayload.data.audit.action, "user.suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?action=user.suspended`, { headers: adminHeaders() });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items.length, 1);
    assert.equal(auditPayload.data.items[0].targetId, "usr_1001");
  });
});

test("admin moderation and dispute decisions produce audit records", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const moderation = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_501/decision`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ decision: "reject", reason: "Requests off-platform payment" })
    });
    const moderationPayload = await moderation.json();

    assert.equal(moderation.status, 200);
    assert.equal(moderationPayload.data.job.moderationStatus, "rejected");
    assert.equal(moderationPayload.data.audit.action, "job.rejected");

    const ruling = await fetch(`${baseUrl}/api/admin/disputes/dsp_9001/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", note: "Evidence supports refund" })
    });
    const rulingPayload = await ruling.json();

    assert.equal(ruling.status, 200);
    assert.equal(rulingPayload.data.dispute.status, "resolved");
    assert.equal(rulingPayload.data.audit.action, "dispute.refund");
  });
});

test("admin platform controls require boolean payload and log toggles", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: "no" })
    });
    assert.equal(invalid.status, 404);

    const response = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false, reason: "Incident response window" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.control.enabled, false);
    assert.equal(payload.data.audit.action, "control.toggle");
  });
});
