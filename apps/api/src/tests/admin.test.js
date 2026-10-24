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

function adminHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "admin_test", role: "admin" })}`,
    "content-type": "application/json"
  };
}

function clientHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "client_test", role: "client" })}`,
    "content-type": "application/json"
  };
}

test("admin API rejects anonymous and non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/admin/metrics`);
    const nonAdmin = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: clientHeaders()
    });

    assert.equal(anonymous.status, 401);
    assert.equal(nonAdmin.status, 403);
  });
});

test("admin metrics returns operational dashboard data", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.totalUsers, "number");
    assert.equal(typeof payload.data.activeJobs, "number");
    assert.ok(Array.isArray(payload.data.trustDistribution));
  });
});

test("admin user list supports filtering and pagination", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&pageSize=1`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.pageSize, 1);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].role, "freelancer");
    assert.ok(payload.data.total >= 1);
  });
});

test("admin mutations update records and append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_1001/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended" })
    });
    const updatePayload = await update.json();

    assert.equal(update.status, 200);
    assert.equal(updatePayload.data.user.status, "suspended");
    assert.equal(updatePayload.data.audit.action, "update_user_status");

    const audit = await fetch(`${baseUrl}/api/admin/audit?action=update_user_status`, {
      headers: adminHeaders()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_1001");
  });
});

test("admin listing and dispute actions validate requested decisions", async () => {
  await withServer(async (baseUrl) => {
    const listing = await fetch(`${baseUrl}/api/admin/moderation/job_2001`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Violates platform policy" })
    });
    const listingPayload = await listing.json();

    assert.equal(listing.status, 200);
    assert.equal(listingPayload.data.listing.status, "rejected");
    assert.match(listingPayload.data.listing.notification, /Violates platform policy/);

    const dispute = await fetch(`${baseUrl}/api/admin/disputes/disp_3001/ruling`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", note: "Refund client escrow" })
    });
    const disputePayload = await dispute.json();

    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");
    assert.equal(disputePayload.data.dispute.ruling, "refund");
    assert.equal(disputePayload.data.dispute.notifications.length, 2);
  });
});
