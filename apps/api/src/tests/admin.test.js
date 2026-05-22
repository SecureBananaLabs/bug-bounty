import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { resetAdminData } from "../services/adminService.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function token(role = "admin") {
  return signAccessToken({ sub: `${role}_user`, role, email: `${role}@example.com` });
}

async function request(baseUrl, path, { auth = token(), method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  return { response, payload };
}

test("admin routes reject authenticated non-admin users", async () => {
  resetAdminData();

  await withServer(async (baseUrl) => {
    const { response, payload } = await request(baseUrl, "/api/admin/metrics", { auth: token("client") });

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.match(payload.message, /admin access required/i);
  });
});

test("user management supports filters, status changes, and audit entries", async () => {
  resetAdminData();

  await withServer(async (baseUrl) => {
    const listed = await request(baseUrl, "/api/admin/users?role=freelancer&status=active&pageSize=1");
    assert.equal(listed.response.status, 200);
    assert.equal(listed.payload.data.total, 1);
    assert.equal(listed.payload.data.items[0].id, "usr_001");

    const updated = await request(baseUrl, "/api/admin/users/usr_001/status", {
      method: "PATCH",
      body: { status: "suspended", reason: "chargeback review" }
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.data.user.status, "suspended");
    assert.equal(updated.payload.data.audit.actionType, "user.suspended");

    const audit = await request(baseUrl, "/api/admin/audit-log?actionType=user.suspended");
    assert.equal(audit.payload.data.total, 1);
    assert.equal(audit.payload.data.items[0].targetId, "usr_001");
  });
});

test("listing moderation rejects listings and notifies the posting user", async () => {
  resetAdminData();

  await withServer(async (baseUrl) => {
    const moderation = await request(baseUrl, "/api/admin/moderation/jobs?status=flagged");
    assert.equal(moderation.payload.data.total, 1);

    const rejected = await request(baseUrl, "/api/admin/moderation/jobs/flag_001/decision", {
      method: "POST",
      body: { decision: "reject", reason: "Prohibited data source" }
    });

    assert.equal(rejected.response.status, 200);
    assert.equal(rejected.payload.data.listing.status, "rejected");
    assert.equal(rejected.payload.data.notification.userId, "usr_004");
    assert.equal(rejected.payload.data.audit.actionType, "listing.rejected");
  });
});

test("dispute rulings update status, notify both parties, and write audit history", async () => {
  resetAdminData();

  await withServer(async (baseUrl) => {
    const details = await request(baseUrl, "/api/admin/disputes/dsp_001");
    assert.equal(details.response.status, 200);
    assert.equal(details.payload.data.thread.length, 2);
    assert.equal(details.payload.data.transactions[0].status, "held");

    const ruled = await request(baseUrl, "/api/admin/disputes/dsp_001/ruling", {
      method: "POST",
      body: { ruling: "refund", note: "Client evidence confirms non-delivery." }
    });

    assert.equal(ruled.response.status, 200);
    assert.equal(ruled.payload.data.dispute.status, "resolved");
    assert.equal(ruled.payload.data.notifications.length, 2);
    assert.equal(ruled.payload.data.audit.actionType, "dispute.resolved");
  });
});

test("platform controls require confirmation and record changed settings", async () => {
  resetAdminData();

  await withServer(async (baseUrl) => {
    const missingConfirmation = await request(baseUrl, "/api/admin/controls", {
      method: "PATCH",
      body: { registrationsEnabled: false }
    });
    assert.equal(missingConfirmation.response.status, 400);

    const changed = await request(baseUrl, "/api/admin/controls", {
      method: "PATCH",
      body: { registrationsEnabled: false, jobPostingEnabled: false, confirmed: true }
    });
    assert.equal(changed.response.status, 200);
    assert.equal(changed.payload.data.controls.registrationsEnabled, false);
    assert.equal(changed.payload.data.controls.jobPostingEnabled, false);
    assert.equal(changed.payload.data.audit.actionType, "platform.controls.updated");
  });
});
