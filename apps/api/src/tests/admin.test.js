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

function authHeaders(role = "admin") {
  const token = signAccessToken({ sub: `test-${role}`, role });
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

test("admin routes reject missing and non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/metrics`);
    const missingPayload = await missing.json();

    assert.equal(missing.status, 401);
    assert.equal(missingPayload.success, false);

    const client = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders("client")
    });
    const clientPayload = await client.json();

    assert.equal(client.status, 403);
    assert.equal(clientPayload.message, "Admin role required");
  });
});

test("admin metrics return operational dashboard summary", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.totalUsers, "number");
    assert.equal(typeof payload.data.openDisputes, "number");
    assert.equal(payload.data.platformControls.registrationsEnabled, true);
    assert.equal(payload.data.trustScoreDistribution.length, 3);
  });
});

test("admin user listing is paginated and filterable", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=client&pageSize=1`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.pageSize, 1);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].role, "client");
    assert.ok(payload.data.total >= 1);
  });
});

test("admin user status actions write audit entries", async () => {
  await withServer(async (baseUrl) => {
    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_1001/status`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ status: "suspended" })
    });
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.status, "suspended");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=user`, {
      headers: authHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].action, "user.suspended");
    assert.equal(auditPayload.data.items[0].targetId, "usr_1001");
  });
});

test("admin controls update platform switches with audit trail", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/controls`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ registrationsEnabled: false, jobPostingsEnabled: false })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.registrationsEnabled, false);
    assert.equal(payload.data.jobPostingsEnabled, false);

    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders()
    });
    const metricsPayload = await metricsResponse.json();

    assert.equal(metricsPayload.data.platformControls.registrationsEnabled, false);
    assert.equal(metricsPayload.data.platformControls.jobPostingsEnabled, false);
  });
});

test("admin moderation and dispute actions return notifications", async () => {
  await withServer(async (baseUrl) => {
    const moderationResponse = await fetch(`${baseUrl}/api/admin/moderation/job_2001/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ decision: "rejected", reason: "Policy risk" })
    });
    const moderationPayload = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.equal(moderationPayload.data.listing.status, "rejected");
    assert.equal(moderationPayload.data.notification.recipientId, "usr_1001");

    const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_3001/ruling`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ruling: "freelancer", refund: false, reason: "Evidence accepted" })
    });
    const disputePayload = await disputeResponse.json();

    assert.equal(disputeResponse.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");
    assert.equal(disputePayload.data.notifications.length, 2);
  });
});
