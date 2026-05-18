import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startTestServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

function tokenFor(role, id = `${role}_tester`) {
  return signAccessToken({ sub: id, email: `${id}@example.com`, role });
}

async function apiRequest(baseUrl, path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();
  return { response, payload };
}

test("admin routes require an authenticated admin token", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const anonymous = await apiRequest(baseUrl, "/api/admin/metrics");
    assert.equal(anonymous.response.status, 401);
    assert.equal(anonymous.payload.success, false);

    const client = await apiRequest(baseUrl, "/api/admin/metrics", {
      token: tokenFor("client", "client_200")
    });
    assert.equal(client.response.status, 403);
    assert.equal(client.payload.success, false);
    assert.match(client.payload.message, /admin/i);

    const admin = await apiRequest(baseUrl, "/api/admin/metrics", {
      token: tokenFor("admin", "admin_100")
    });
    assert.equal(admin.response.status, 200);
    assert.equal(admin.payload.success, true);
    assert.deepEqual(Object.keys(admin.payload.data).sort(), [
      "activeJobs",
      "flaggedListings",
      "openDisputes",
      "revenueCurrentPeriod",
      "totalUsers",
      "trustScoreDistribution"
    ]);
  } finally {
    await close();
  }
});

test("admin can page, search, filter, and inspect users without fetching the full table", async () => {
  const { baseUrl, close } = await startTestServer();
  const adminToken = tokenFor("ADMIN", "admin_101");
  try {
    const users = await apiRequest(
      baseUrl,
      "/api/admin/users?page=1&pageSize=2&role=freelancer&status=active&search=maya&joinedFrom=2026-01-01",
      { token: adminToken }
    );

    assert.equal(users.response.status, 200);
    assert.equal(users.payload.data.items.length, 1);
    assert.equal(users.payload.data.items[0].id, "usr_freelancer_1");
    assert.equal(users.payload.data.items[0].role, "freelancer");
    assert.equal(users.payload.data.items[0].status, "active");
    assert.deepEqual(users.payload.data.pagination, {
      page: 1,
      pageSize: 2,
      totalItems: 1,
      totalPages: 1
    });

    const detail = await apiRequest(baseUrl, "/api/admin/users/usr_freelancer_1", {
      token: adminToken
    });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.payload.data.profile.email, "maya@example.com");
    assert.equal(detail.payload.data.activeJobs.length, 1);
    assert.equal(detail.payload.data.disputeHistory.length, 1);
  } finally {
    await close();
  }
});

test("admin user actions mutate account status and append audit log entries", async () => {
  const { baseUrl, close } = await startTestServer();
  const adminToken = tokenFor("admin", "admin_102");
  try {
    const suspended = await apiRequest(baseUrl, "/api/admin/users/usr_client_2/status", {
      token: adminToken,
      method: "PATCH",
      body: { status: "suspended", reason: "Repeated off-platform payment attempts" }
    });

    assert.equal(suspended.response.status, 200);
    assert.equal(suspended.payload.data.user.status, "suspended");
    assert.equal(suspended.payload.data.audit.actionType, "user_status");
    assert.equal(suspended.payload.data.audit.adminId, "admin_102");

    const reinstated = await apiRequest(baseUrl, "/api/admin/users/usr_client_2/status", {
      token: adminToken,
      method: "PATCH",
      body: { status: "active", reason: "Identity documents verified" }
    });

    assert.equal(reinstated.response.status, 200);
    assert.equal(reinstated.payload.data.user.status, "active");

    const logs = await apiRequest(baseUrl, "/api/admin/audit-logs?actionType=user_status", {
      token: adminToken
    });
    assert.equal(logs.response.status, 200);
    assert.equal(logs.payload.data.items.length >= 2, true);
    assert.equal(logs.payload.data.items[0].actionType, "user_status");
  } finally {
    await close();
  }
});

test("admin can moderate flagged listings and notify the posting user on rejection", async () => {
  const { baseUrl, close } = await startTestServer();
  const adminToken = tokenFor("admin", "admin_103");
  try {
    const queue = await apiRequest(baseUrl, "/api/admin/moderation/jobs?status=flagged", {
      token: adminToken
    });
    assert.equal(queue.response.status, 200);
    assert.equal(queue.payload.data.items.some((job) => job.id === "flagged_job_1"), true);

    const rejected = await apiRequest(baseUrl, "/api/admin/moderation/jobs/flagged_job_1", {
      token: adminToken,
      method: "PATCH",
      body: { decision: "reject", reason: "The listing asks applicants to bypass escrow." }
    });

    assert.equal(rejected.response.status, 200);
    assert.equal(rejected.payload.data.listing.moderationStatus, "rejected");
    assert.equal(rejected.payload.data.notification.userId, "usr_client_1");
    assert.equal(rejected.payload.data.audit.actionType, "listing_moderation");
  } finally {
    await close();
  }
});

test("admin can review disputes, issue rulings, trigger refunds, and notify both parties", async () => {
  const { baseUrl, close } = await startTestServer();
  const adminToken = tokenFor("admin", "admin_104");
  try {
    const disputes = await apiRequest(baseUrl, "/api/admin/disputes?status=open", {
      token: adminToken
    });
    assert.equal(disputes.response.status, 200);
    assert.equal(disputes.payload.data.items.some((dispute) => dispute.id === "dispute_1"), true);

    const detail = await apiRequest(baseUrl, "/api/admin/disputes/dispute_1", {
      token: adminToken
    });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.payload.data.thread.length, 2);
    assert.equal(detail.payload.data.evidence.length, 2);
    assert.equal(detail.payload.data.transaction.amount, 900);

    const ruling = await apiRequest(baseUrl, "/api/admin/disputes/dispute_1/ruling", {
      token: adminToken,
      method: "PATCH",
      body: {
        ruling: "client",
        refund: true,
        notes: "Milestone evidence shows the agreed deliverable was not provided."
      }
    });

    assert.equal(ruling.response.status, 200);
    assert.equal(ruling.payload.data.dispute.status, "resolved");
    assert.equal(ruling.payload.data.dispute.ruling, "client");
    assert.equal(ruling.payload.data.dispute.refundTriggered, true);
    assert.equal(ruling.payload.data.notifications.length, 2);
    assert.equal(ruling.payload.data.audit.actionType, "dispute_ruling");
  } finally {
    await close();
  }
});

test("platform controls require confirmation and every change is audited", async () => {
  const { baseUrl, close } = await startTestServer();
  const adminToken = tokenFor("admin", "admin_105");
  try {
    const controls = await apiRequest(baseUrl, "/api/admin/platform-controls", {
      token: adminToken
    });
    assert.equal(controls.response.status, 200);
    assert.equal(controls.payload.data.registrations.enabled, true);

    const missingConfirmation = await apiRequest(
      baseUrl,
      "/api/admin/platform-controls/registrations",
      {
        token: adminToken,
        method: "PATCH",
        body: { enabled: false }
      }
    );
    assert.equal(missingConfirmation.response.status, 400);
    assert.match(missingConfirmation.payload.message, /confirmation/i);

    const disabled = await apiRequest(baseUrl, "/api/admin/platform-controls/registrations", {
      token: adminToken,
      method: "PATCH",
      body: { enabled: false, confirm: true }
    });
    assert.equal(disabled.response.status, 200);
    assert.equal(disabled.payload.data.control.enabled, false);
    assert.equal(disabled.payload.data.audit.actionType, "control_update");

    const audit = await apiRequest(baseUrl, "/api/admin/audit-logs?actionType=control_update", {
      token: adminToken
    });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items[0].targetId, "registrations");
  } finally {
    await close();
  }
});

test("admin audit log supports action, admin, and date range filters", async () => {
  const { baseUrl, close } = await startTestServer();
  const adminToken = tokenFor("admin", "admin_106");
  try {
    const from = encodeURIComponent(new Date(Date.now() - 60_000).toISOString());
    const to = encodeURIComponent(new Date(Date.now() + 60_000).toISOString());

    const status = await apiRequest(baseUrl, "/api/admin/users/usr_freelancer_2/status", {
      token: adminToken,
      method: "PATCH",
      body: { status: "banned", reason: "Chargeback and identity review failed" }
    });
    assert.equal(status.response.status, 200);

    const filtered = await apiRequest(
      baseUrl,
      `/api/admin/audit-logs?actionType=user_status&admin=admin_106&from=${from}&to=${to}`,
      { token: adminToken }
    );
    assert.equal(filtered.response.status, 200);
    assert.equal(filtered.payload.data.items.length >= 1, true);
    assert.equal(filtered.payload.data.items[0].adminId, "admin_106");
    assert.equal(filtered.payload.data.items[0].actionType, "user_status");

    const futureFrom = encodeURIComponent(new Date(Date.now() + 86_400_000).toISOString());
    const future = await apiRequest(baseUrl, `/api/admin/audit-logs?actionType=user_status&from=${futureFrom}`, {
      token: adminToken
    });
    assert.equal(future.response.status, 200);
    assert.equal(future.payload.data.items.length, 0);
  } finally {
    await close();
  }
});
