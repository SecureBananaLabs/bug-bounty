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

function adminToken() {
  return signAccessToken({ sub: "admin_test", role: "admin" });
}

function clientToken() {
  return signAccessToken({ sub: "client_test", role: "client" });
}

test("admin routes require an authenticated admin role", async () => {
  await withServer(async (baseUrl) => {
    const noToken = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(noToken.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { authorization: `Bearer ${clientToken()}` }
    });
    assert.equal(client.status, 403);
  });
});

test("admin overview returns metrics, controls, trust chart, and audit log", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { authorization: `Bearer ${adminToken()}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.metrics.totalUsers, 4);
    assert.equal(payload.data.platformControls.registrationsEnabled, true);
    assert.equal(payload.data.trustDistribution.length, 5);
    assert.ok(payload.data.recentAudit.length >= 1);
  });
});

test("admin user action updates status and appends audit entry", async () => {
  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_101/status`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${adminToken()}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ status: "suspended" })
    });
    const payload = await update.json();

    assert.equal(update.status, 200);
    assert.equal(payload.data.user.status, "suspended");
    assert.equal(payload.data.audit.action, "user_suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit?action=user_suspended`, {
      headers: { authorization: `Bearer ${adminToken()}` }
    });
    const auditPayload = await audit.json();
    assert.ok(auditPayload.data.items.some((entry) => entry.targetId === "usr_101"));
  });
});

test("admin moderation, dispute, and control mutations are validated", async () => {
  await withServer(async (baseUrl) => {
    const headers = {
      authorization: `Bearer ${adminToken()}`,
      "content-type": "application/json"
    };

    const listing = await fetch(`${baseUrl}/api/admin/moderation/flag_201`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ decision: "rejected", reason: "Unsafe data request" })
    });
    assert.equal(listing.status, 200);

    const dispute = await fetch(`${baseUrl}/api/admin/disputes/dsp_301/ruling`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ ruling: "client" })
    });
    const disputePayload = await dispute.json();
    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.refundQueued, true);

    const control = await fetch(`${baseUrl}/api/admin/controls/jobPostingEnabled`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ enabled: false })
    });
    const controlPayload = await control.json();
    assert.equal(control.status, 200);
    assert.equal(controlPayload.data.platformControls.jobPostingEnabled, false);
  });
});
