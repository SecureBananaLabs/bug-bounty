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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function tokenFor(role, sub = `${role}_test`) {
  return signAccessToken({ sub, role });
}

function adminHeaders(extra = {}) {
  return {
    authorization: `Bearer ${tokenFor("admin", "admin_test")}`,
    "content-type": "application/json",
    ...extra
  };
}

test("admin routes reject missing and non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(missing.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${tokenFor("client")}` }
    });
    const payload = await client.json();

    assert.equal(client.status, 403);
    assert.equal(payload.message, "Admin access required");
  });
});

test("admin can filter users and update user status with an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const usersResponse = await fetch(
      `${baseUrl}/api/admin/users?role=freelancer&status=active&pageSize=5`,
      { headers: adminHeaders() }
    );
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.total, 1);
    assert.equal(usersPayload.data.items[0].id, "usr_freelancer_1");

    const statusResponse = await fetch(
      `${baseUrl}/api/admin/users/usr_freelancer_1/status`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ status: "suspended" })
      }
    );
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.user.status, "suspended");

    const auditResponse = await fetch(
      `${baseUrl}/api/admin/audit-log?action=user.status_updated`,
      { headers: adminHeaders() }
    );
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_freelancer_1");
  });
});

test("admin can reject a flagged job and send the rejection notification", async () => {
  await withServer(async (baseUrl) => {
    const moderationResponse = await fetch(
      `${baseUrl}/api/admin/moderation/jobs?status=flagged`,
      { headers: adminHeaders() }
    );
    const moderationPayload = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.ok(moderationPayload.data.total >= 1);

    const actionResponse = await fetch(
      `${baseUrl}/api/admin/moderation/jobs/job_flagged_1/action`,
      {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ action: "reject", reason: "Restricted payment workflow" })
      }
    );
    const actionPayload = await actionResponse.json();

    assert.equal(actionResponse.status, 200);
    assert.equal(actionPayload.data.job.status, "rejected");
    assert.equal(actionPayload.data.job.notificationStatus, "sent");
  });
});

test("admin can resolve disputes and update platform controls", async () => {
  await withServer(async (baseUrl) => {
    const rulingResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_1/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "split", refundPercent: 50 })
    });
    const rulingPayload = await rulingResponse.json();

    assert.equal(rulingResponse.status, 200);
    assert.equal(rulingPayload.data.dispute.status, "resolved");
    assert.equal(rulingPayload.data.dispute.notificationStatus, "sent");

    const controlResponse = await fetch(
      `${baseUrl}/api/admin/controls/registrationsEnabled`,
      {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ enabled: false })
      }
    );
    const controlPayload = await controlResponse.json();

    assert.equal(controlResponse.status, 200);
    assert.equal(controlPayload.data.registrationsEnabled.enabled, false);
    assert.equal(controlPayload.data.registrationsEnabled.updatedBy, "admin_test");
  });
});
