import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "usr_admin", role: "admin" })}`,
    "content-type": "application/json"
  };
}

test("admin routes require an admin token", async () => {
  await withServer(async (baseURL) => {
    const noToken = await fetch(`${baseURL}/api/admin/metrics`);
    assert.equal(noToken.status, 401);

    const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });
    const client = await fetch(`${baseURL}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` }
    });
    assert.equal(client.status, 403);
  });
});

test("admin can inspect and act on users, jobs, disputes, controls, and audit log", async () => {
  await withServer(async (baseURL) => {
    const metrics = await fetch(`${baseURL}/api/admin/metrics`, { headers: adminHeaders() });
    const metricsPayload = await metrics.json();
    assert.equal(metrics.status, 200);
    assert.equal(metricsPayload.data.openDisputes, 1);

    const users = await fetch(`${baseURL}/api/admin/users?role=freelancer`, { headers: adminHeaders() });
    const usersPayload = await users.json();
    assert.equal(users.status, 200);
    assert.equal(usersPayload.data.length, 2);

    const suspended = await fetch(`${baseURL}/api/admin/users/usr_freelancer_1/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Manual risk review" })
    });
    const suspendedPayload = await suspended.json();
    assert.equal(suspended.status, 200);
    assert.equal(suspendedPayload.data.status, "suspended");

    const moderated = await fetch(`${baseURL}/api/admin/moderation/jobs/job_102`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Reported payment terms violate marketplace rules" })
    });
    const moderatedPayload = await moderated.json();
    assert.equal(moderated.status, 200);
    assert.equal(moderatedPayload.data.status, "rejected");

    const dispute = await fetch(`${baseURL}/api/admin/disputes/dsp_100/ruling`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "freelancer", note: "Evidence shows the repository and handoff were delivered" })
    });
    const disputePayload = await dispute.json();
    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.status, "resolved");

    const controls = await fetch(`${baseURL}/api/admin/controls`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ key: "jobPosting", value: "review_required" })
    });
    const controlsPayload = await controls.json();
    assert.equal(controls.status, 200);
    assert.equal(controlsPayload.data.jobPosting, "review_required");

    const auditLog = await fetch(`${baseURL}/api/admin/audit-log`, { headers: adminHeaders() });
    const auditPayload = await auditLog.json();
    assert.equal(auditLog.status, 200);
    assert.ok(auditPayload.data.some((entry) => entry.action === "resolve_dispute"));
  });
});
