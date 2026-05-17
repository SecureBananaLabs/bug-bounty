import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { __resetAdminStateForTests } from "../services/adminService.js";

async function withServer(assertion) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertion(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders(role = "admin") {
  return {
    authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "content-type": "application/json"
  };
}

test("admin routes reject missing and non-admin credentials", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(missing.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: authHeaders("client")
    });
    const payload = await client.json();

    assert.equal(client.status, 403);
    assert.equal(payload.message, "Forbidden: admin role required");
  });
});

test("admin overview returns metrics and trust distribution", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: authHeaders()
    });
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

test("admin users endpoint filters and paginates server-side", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&status=suspended&page=1&pageSize=1`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.pageSize, 1);
    assert.equal(payload.data.total, 1);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].role, "freelancer");
    assert.equal(payload.data.items[0].status, "suspended");
  });
});

test("admin can inspect a user profile with jobs and disputes", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_client_101`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.id, "usr_client_101");
    assert.equal(payload.data.activeJobs.length, 2);
    assert.equal(payload.data.disputeHistory[0].id, "dsp_501");
  });
});

test("admin can change user status and audit the action", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_free_218/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "banned", reason: "Repeated policy violations" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.user.status, "banned");
    assert.equal(payload.data.audit.action, "admin.user.banned");

    const audit = await fetch(`${baseUrl}/api/admin/audit?action=admin.user`, {
      headers: authHeaders()
    });
    const auditPayload = await audit.json();
    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_free_218");
  });
});

test("admin moderation rejection notifies poster and records audit entry", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/moderation/mod_701/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ decision: "reject", reason: "Copies another platform" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.item.status, "rejected");
    assert.equal(payload.data.notification.type, "listing_rejected");
    assert.equal(payload.data.audit.action, "admin.moderation.reject");
  });
});

test("admin can inspect dispute evidence and issue a refund ruling", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const details = await fetch(`${baseUrl}/api/admin/disputes/dsp_501`, {
      headers: authHeaders()
    });
    const detailsPayload = await details.json();

    assert.equal(details.status, 200);
    assert.equal(detailsPayload.data.transactionId, "txn_9001");
    assert.equal(detailsPayload.data.thread.length, 2);
    assert.equal(detailsPayload.data.evidence[0].label, "Preview deployment");

    const response = await fetch(`${baseUrl}/api/admin/disputes/dsp_501/ruling`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "Milestone not delivered" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.dispute.status, "resolved");
    assert.equal(payload.data.dispute.financialAction.type, "refund");
    assert.equal(payload.data.audit.action, "admin.dispute.refund");
  });
});

test("platform controls require confirmation and append audit entries", async () => {
  __resetAdminStateForTests();
  await withServer(async (baseUrl) => {
    const denied = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(denied.status, 400);

    const response = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ enabled: false, confirmed: true })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.control.enabled, false);
    assert.equal(payload.data.audit.action, "admin.control.updated");
  });
});
