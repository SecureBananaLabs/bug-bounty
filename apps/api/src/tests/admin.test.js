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

function auth(role = "admin") {
  return {
    authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "content-type": "application/json"
  };
}

test("admin routes reject missing and non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(missing.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: auth("client")
    });
    assert.equal(client.status, 403);
  });
});

test("admin metrics, paginated users, actions, and audit log are operational", async () => {
  await withServer(async (baseUrl) => {
    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: auth()
    });
    const metrics = await metricsResponse.json();

    assert.equal(metricsResponse.status, 200);
    assert.equal(metrics.success, true);
    assert.equal(metrics.data.totalUsers >= 5, true);
    assert.equal(typeof metrics.data.trustScoreDistribution.high, "number");

    const usersResponse = await fetch(
      `${baseUrl}/api/admin/users?role=freelancer&status=active&page=1&pageSize=1`,
      { headers: auth() }
    );
    const users = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(users.data.pageSize, 1);
    assert.equal(users.data.data[0].role, "freelancer");
    assert.equal(users.data.data[0].status, "active");

    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_freelancer_2/status`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({
        status: "suspended",
        reason: "Manual fraud review"
      })
    });
    const status = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(status.data.user.status, "suspended");
    assert.equal(status.data.audit.action, "user.suspended");

    const listingResponse = await fetch(`${baseUrl}/api/admin/moderation/jobs/job-201/decision`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({
        decision: "rejected",
        reason: "External payment language"
      })
    });
    const listing = await listingResponse.json();

    assert.equal(listingResponse.status, 200);
    assert.equal(listing.data.job.status, "rejected");
    assert.match(listing.data.notification, /External payment language/);

    const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/disp-301/ruling`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({
        ruling: "refund",
        reason: "Evidence supports refund"
      })
    });
    const dispute = await disputeResponse.json();

    assert.equal(disputeResponse.status, 200);
    assert.equal(dispute.data.dispute.status, "resolved");
    assert.equal(dispute.data.dispute.ruling.refundTriggered, true);
    assert.equal(dispute.data.notifications.length, 2);

    const controlResponse = await fetch(`${baseUrl}/api/admin/controls/jobPostings`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({
        enabled: false,
        confirmed: true
      })
    });
    const control = await controlResponse.json();

    assert.equal(controlResponse.status, 200);
    assert.equal(control.data.control.enabled, false);
    assert.equal(control.data.audit.targetId, "jobPostings");

    const auditResponse = await fetch(
      `${baseUrl}/api/admin/audit-log?action=platform.control&page=1&pageSize=5`,
      { headers: auth() }
    );
    const audit = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(audit.data.data[0].action, "platform.control.updated");
    assert.equal(audit.data.total >= 1, true);
  });
});
