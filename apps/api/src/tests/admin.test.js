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
    Authorization: `Bearer ${signAccessToken({ sub: "usr_admin_01", role: "ADMIN" })}`,
    "Content-Type": "application/json"
  };
}

function clientHeaders() {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: "usr_client_01", role: "CLIENT" })}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject authenticated non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers: clientHeaders() });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin metrics include required platform health summary", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers: adminHeaders() });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.totalUsers, "number");
    assert.equal(typeof payload.data.activeJobs, "number");
    assert.equal(typeof payload.data.openDisputes, "number");
    assert.equal(typeof payload.data.flaggedListings, "number");
    assert.equal(typeof payload.data.revenueCurrentPeriod, "number");
    assert.ok(Array.isArray(payload.data.trustScoreDistribution));
  });
});

test("admin can paginate users, change account status, and create an audit log entry", async () => {
  await withServer(async (baseUrl) => {
    const usersResponse = await fetch(`${baseUrl}/api/admin/users?page=1&pageSize=2&role=CLIENT`, {
      headers: adminHeaders()
    });
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.items.length, 2);
    assert.equal(usersPayload.data.pagination.pageSize, 2);

    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_01/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "SUSPENDED" })
    });
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.status, "SUSPENDED");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?actionType=USER_SUSPENDED`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_client_01");
  });
});

test("rejecting a flagged listing notifies the posting user", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_101`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "External payment links are not allowed." })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.moderationStatus, "REJECTED");

    const notificationsResponse = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: adminHeaders()
    });
    const notificationsPayload = await notificationsResponse.json();

    assert.equal(notificationsResponse.status, 200);
    const rejectionNotice = notificationsPayload.data.notifications.find((notification) =>
      notification.body.includes("External payment links")
    );

    assert.ok(rejectionNotice);
    assert.equal(rejectionNotice.userId, "usr_client_01");
  });
});

test("dispute rulings update status and are written to the audit log", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/disputes/dis_1001/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", note: "Refund approved after evidence review." })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.status, "resolved");
    assert.equal(payload.data.ruling.ruling, "refund");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?actionType=DISPUTE_RULED`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "dis_1001");
  });
});
