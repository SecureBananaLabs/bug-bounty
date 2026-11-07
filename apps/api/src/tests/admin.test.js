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

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function auth(role) {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: auth("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin overview returns metrics, controls, and audit feed", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: auth("admin")
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.metrics.totalUsers, "number");
    assert.equal(typeof payload.data.controls.registrationsEnabled, "boolean");
    assert.ok(Array.isArray(payload.data.trustDistribution));
    assert.ok(Array.isArray(payload.data.recentAudit));
  });
});

test("admin can update user status and audit the action", async () => {
  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_1001/status`, {
      method: "PATCH",
      headers: auth("admin"),
      body: JSON.stringify({ status: "suspended" })
    });
    const updatedPayload = await update.json();

    assert.equal(update.status, 200);
    assert.equal(updatedPayload.data.status, "suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit-log`, {
      headers: auth("admin")
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data[0].action, "user.status.updated");
    assert.equal(auditPayload.data[0].target, "usr_1001");
  });
});

test("admin can resolve moderation, disputes, and platform controls", async () => {
  await withServer(async (baseUrl) => {
    const moderation = await fetch(`${baseUrl}/api/admin/moderation/flag_2001`, {
      method: "PATCH",
      headers: auth("admin"),
      body: JSON.stringify({ action: "rejected", reason: "Policy violation" })
    });
    const moderationPayload = await moderation.json();

    assert.equal(moderation.status, 200);
    assert.equal(moderationPayload.data.status, "rejected");

    const dispute = await fetch(`${baseUrl}/api/admin/disputes/dsp_3001/ruling`, {
      method: "PATCH",
      headers: auth("admin"),
      body: JSON.stringify({ outcome: "freelancer", note: "Delivery evidence accepted" })
    });
    const disputePayload = await dispute.json();

    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.status, "resolved");
    assert.equal(disputePayload.data.ruling.outcome, "freelancer");

    const control = await fetch(`${baseUrl}/api/admin/controls/jobPostingEnabled`, {
      method: "PATCH",
      headers: auth("admin"),
      body: JSON.stringify({ enabled: false })
    });
    const controlPayload = await control.json();

    assert.equal(control.status, 200);
    assert.deepEqual(controlPayload.data, { key: "jobPostingEnabled", enabled: false });
  });
});
