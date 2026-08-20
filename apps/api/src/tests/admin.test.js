import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertion) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await assertion(`http://127.0.0.1:${port}`);
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

test("admin routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: `Bearer ${clientToken()}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Admin access required");
  });
});

test("admin metrics returns operational dashboard data for admins", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: `Bearer ${adminToken()}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 4);
    assert.equal(payload.data.openDisputes, 2);
    assert.equal(payload.data.flaggedListings, 3);
    assert.equal(payload.data.trustScoreDistribution.length, 4);
  });
});

test("admins can update user status and receive an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_1003/status`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${adminToken()}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ status: "active" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.user.status, "active");
    assert.equal(payload.data.audit.action, "user.reinstate");
    assert.equal(payload.data.audit.adminId, "admin_test");
  });
});

test("admins can moderate flagged jobs and notify rejected listing owners", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/moderation/jobs/flag_2002/decision`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken()}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        decision: "rejected",
        reason: "Budget anomaly confirmed during review."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.job.status, "rejected");
    assert.match(payload.data.notification, /notified/);
    assert.equal(payload.data.audit.action, "job.rejected");
  });
});

test("admins can change platform controls with audit coverage", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/platform-controls/registrations`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${adminToken()}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ enabled: false })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.control.enabled, false);
    assert.equal(payload.data.audit.action, "platform.registrations");
  });
});
