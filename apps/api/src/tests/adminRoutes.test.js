import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { resetAdminStateForTests } from "../services/adminService.js";
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
    authorization: `Bearer ${signAccessToken({ sub: "adm_test", role })}`,
    "content-type": "application/json"
  };
}

test("admin endpoints reject non-admin tokens", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: auth("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Forbidden: admin role required"
    });
  });
});

test("admin can list users with server-side filters and pagination", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/admin/users?role=freelancer&status=active&limit=2`,
      { headers: auth() }
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.pagination.total, 1);
    assert.equal(payload.data.items[0].id, "usr_101");
  });
});

test("admin user status changes create audit entries", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_101/status`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ status: "suspended", reason: "risk review" })
    });
    const updatePayload = await update.json();

    assert.equal(update.status, 200);
    assert.equal(updatePayload.data.user.status, "suspended");
    assert.equal(updatePayload.data.audit.action, "user.status_changed");

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?action=user.status_changed`, {
      headers: auth()
    });
    const auditPayload = await audit.json();

    assert.equal(auditPayload.data.items[0].targetId, "usr_101");
    assert.equal(auditPayload.data.items[0].details.reason, "risk review");
  });
});

test("admin can reject flagged listings and resolve disputes", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const listing = await fetch(`${baseUrl}/api/admin/moderation/jobs/flag_401`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ decision: "reject", reason: "outside escrow" })
    });
    const listingPayload = await listing.json();

    assert.equal(listing.status, 200);
    assert.equal(listingPayload.data.listing.status, "rejected");
    assert.equal(listingPayload.data.audit.action, "listing.reject");

    const dispute = await fetch(`${baseUrl}/api/admin/disputes/dsp_501/ruling`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ ruling: "refund", notes: "milestone not delivered" })
    });
    const disputePayload = await dispute.json();

    assert.equal(dispute.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");
    assert.equal(disputePayload.data.dispute.ruling, "refund");
  });
});

test("admin can toggle platform controls with audit logging", async () => {
  resetAdminStateForTests();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/controls/jobPostings`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ enabled: false })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.control.enabled, false);
    assert.equal(payload.data.audit.action, "platform.control_toggled");
  });
});
