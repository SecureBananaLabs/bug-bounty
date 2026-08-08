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
    authorization: `Bearer ${signAccessToken({ sub: "admin_1", role: "admin" })}`,
    "content-type": "application/json"
  };
}

test("admin routes reject unauthenticated and non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(missing.status, 401);

    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const forbidden = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(forbidden.status, 403);
  });
});

test("admin metrics and user listing are available to admins", async () => {
  await withServer(async (baseUrl) => {
    const metrics = await fetch(`${baseUrl}/api/admin/metrics`, { headers: adminHeaders() });
    const metricsPayload = await metrics.json();

    assert.equal(metrics.status, 200);
    assert.equal(metricsPayload.data.totalUsers >= 3, true);
    assert.equal(metricsPayload.data.flaggedListings >= 1, true);

    const users = await fetch(`${baseUrl}/api/admin/users?role=freelancer&limit=1`, {
      headers: adminHeaders()
    });
    const usersPayload = await users.json();

    assert.equal(users.status, 200);
    assert.equal(usersPayload.data.items.length, 1);
    assert.equal(usersPayload.data.total >= 2, true);
  });
});

test("admin can suspend users and audit the action", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_freelancer_1/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Chargeback investigation" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.status, "suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?action=user.suspended`, {
      headers: adminHeaders()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_freelancer_1");
  });
});

test("admin moderation rejects flagged jobs and requires a reason", async () => {
  await withServer(async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_2`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject" })
    });
    assert.equal(invalid.status, 400);

    const response = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_2`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Prohibited scraping request" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.status, "rejected");
    assert.equal(payload.data.flagged, false);
  });
});

test("admin can rule disputes and update platform controls", async () => {
  await withServer(async (baseUrl) => {
    const ruling = await fetch(`${baseUrl}/api/admin/disputes/disp_1/rule`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "freelancer", reason: "Evidence confirms delivery" })
    });
    const rulingPayload = await ruling.json();

    assert.equal(ruling.status, 200);
    assert.equal(rulingPayload.data.status, "resolved");
    assert.equal(rulingPayload.data.ruling, "freelancer");

    const control = await fetch(`${baseUrl}/api/admin/controls/jobPostings`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false, reason: "Incident response window" })
    });
    const controlPayload = await control.json();

    assert.equal(control.status, 200);
    assert.equal(controlPayload.data.enabled, false);
  });
});
