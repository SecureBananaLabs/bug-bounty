import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
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
  return signAccessToken({ sub: `usr_${role}_test`, role });
}

function adminHeaders(role = "admin") {
  return {
    authorization: `Bearer ${token(role)}`,
    "content-type": "application/json"
  };
}

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: adminHeaders("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin metrics and paginated users are available to admins", async () => {
  await withServer(async (baseUrl) => {
    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: adminHeaders()
    });
    const metricsPayload = await metricsResponse.json();

    assert.equal(metricsResponse.status, 200);
    assert.equal(metricsPayload.data.totalUsers, 4);
    assert.ok(Array.isArray(metricsPayload.data.trustDistribution));

    const usersResponse = await fetch(`${baseUrl}/api/admin/users?page=1&pageSize=2&role=client`, {
      headers: adminHeaders()
    });
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.pageSize, 2);
    assert.equal(usersPayload.data.items.every((user) => user.role === "client"), true);
  });
});

test("admin user actions write an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const actionResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "risk review" })
    });
    const actionPayload = await actionResponse.json();

    assert.equal(actionResponse.status, 200);
    assert.equal(actionPayload.data.user.status, "suspended");
    assert.equal(actionPayload.data.audit.action, "user.suspended");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=user`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_client_1");
  });
});

test("admin moderation, disputes, and controls mutate operational state", async () => {
  await withServer(async (baseUrl) => {
    const moderationResponse = await fetch(`${baseUrl}/api/admin/moderation/mod_201/action`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "unsafe payment request" })
    });
    const moderationPayload = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.equal(moderationPayload.data.listing.status, "rejected");

    const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_301/action`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "scope not delivered" })
    });
    const disputePayload = await disputeResponse.json();

    assert.equal(disputeResponse.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");

    const controlsResponse = await fetch(`${baseUrl}/api/admin/controls`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ registrationsEnabled: false })
    });
    const controlsPayload = await controlsResponse.json();

    assert.equal(controlsResponse.status, 200);
    assert.equal(controlsPayload.data.controls.registrationsEnabled, false);
  });
});
