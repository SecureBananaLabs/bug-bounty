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

function headers(role = "admin") {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: headers("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin overview returns metrics and controls", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: headers()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.metrics.totalUsers, "number");
    assert.equal(typeof payload.data.platformControls.registrationsEnabled, "boolean");
  });
});

test("admin actions update records and append audit rows", async () => {
  await withServer(async (baseUrl) => {
    const action = await fetch(`${baseUrl}/api/admin/users/usr_003/status`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "active" })
    });
    const actionPayload = await action.json();

    assert.equal(action.status, 200);
    assert.equal(actionPayload.data.user.status, "active");
    assert.equal(actionPayload.data.audit.action, "user.active");

    const audit = await fetch(`${baseUrl}/api/admin/audit?action=user`, {
      headers: headers()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.ok(auditPayload.data.items.some((entry) => entry.action === "user.active"));
  });
});

test("admin users support role, status, joined-date, and pagination filters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/admin/users?role=freelancer&status=active&joinedFrom=2026-01-01&page=1&pageSize=1`,
      { headers: headers() }
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.total, 1);
    assert.equal(payload.data.pageSize, 1);
    assert.equal(payload.data.items[0].id, "usr_002");
  });
});

test("admin moderation returns rejected-listing notification proof", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_flag_001`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ action: "reject", reason: "Bypasses platform payment flow" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.listing.status, "rejected");
    assert.equal(payload.data.notification.sent, true);
    assert.equal(payload.data.notification.reason, "Bypasses platform payment flow");
    assert.equal(payload.data.audit.action, "listing.rejected");
  });
});

test("admin dispute ruling exposes transaction, evidence, refund, notifications, and audit", async () => {
  await withServer(async (baseUrl) => {
    const listResponse = await fetch(`${baseUrl}/api/admin/disputes?status=open`, {
      headers: headers()
    });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.data.items[0].transaction.paymentId, "pay_441");
    assert.ok(listPayload.data.items[0].evidence.length > 0);

    const rulingResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_001/ruling`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ruling: "client" })
    });
    const rulingPayload = await rulingResponse.json();

    assert.equal(rulingResponse.status, 200);
    assert.equal(rulingPayload.data.dispute.status, "resolved");
    assert.deepEqual(rulingPayload.data.refund, { paymentId: "pay_441", amountUsd: 1200 });
    assert.deepEqual(rulingPayload.data.notifications, ["usr_001", "usr_002"]);
    assert.equal(rulingPayload.data.audit.action, "dispute.client");
  });
});

test("admin platform controls and audit log are filterable", async () => {
  await withServer(async (baseUrl) => {
    const controlResponse = await fetch(`${baseUrl}/api/admin/controls/jobPostingsEnabled`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ enabled: false })
    });
    const controlPayload = await controlResponse.json();

    assert.equal(controlResponse.status, 200);
    assert.equal(controlPayload.data.platformControls.jobPostingsEnabled, false);
    assert.equal(controlPayload.data.audit.action, "control.jobPostingsEnabled");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit?adminId=usr_admin&action=control`, {
      headers: headers()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.ok(auditPayload.data.items.some((entry) => entry.action === "control.jobPostingsEnabled"));
  });
});
