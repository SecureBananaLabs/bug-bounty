import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const adminToken = signAccessToken({ sub: "admin_test", role: "admin" });
const clientToken = signAccessToken({ sub: "client_test", role: "client" });

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders(token = adminToken) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

test("admin routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("admin routes reject non-admin tokens server-side", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: adminHeaders(clientToken)
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Forbidden: admin role required");
  });
});

test("admin overview returns trust metrics and platform controls", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 5);
    assert.equal(payload.data.flaggedListings, 2);
    assert.equal(payload.data.settings.registrationsEnabled, true);
    assert.ok(payload.data.trustDistribution.length >= 4);
  });
});

test("admin user list supports pagination and filters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&status=active&pageSize=1`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.pageSize, 1);
    assert.equal(payload.data.total, 2);
    assert.equal(payload.data.items[0].role, "freelancer");
    assert.equal(payload.data.items[0].status, "active");
  });
});

test("admin actions update state and append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_sana/status`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "active" })
    });
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.user.status, "active");
    assert.equal(statusPayload.data.audit.action, "user.active");

    const settingsResponse = await fetch(`${baseUrl}/api/admin/settings/jobPostingEnabled`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    const settingsPayload = await settingsResponse.json();

    assert.equal(settingsResponse.status, 200);
    assert.equal(settingsPayload.data.settings.jobPostingEnabled, false);

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit?action=user.active`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].action, "user.active");
    assert.equal(auditPayload.data.items[0].adminId, "admin_test");
  });
});

test("listing rejection notifies poster and writes an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/moderation/job_scraper/decision`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ decision: "rejected", reason: "Prohibited scraping request" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.listing.status, "rejected");
    assert.equal(payload.data.audit.action, "listing.rejected");
  });
});

test("dispute rulings resolve disputes and notify both parties", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/disputes/dsp_1002/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "freelancer" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.dispute.status, "resolved");
    assert.equal(payload.data.dispute.ruling, "freelancer");
    assert.equal(payload.data.audit.action, "dispute.freelancer");
  });
});
