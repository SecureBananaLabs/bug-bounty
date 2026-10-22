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

function token(role) {
  return signAccessToken({ sub: `usr_${role}`, role });
}

function adminHeaders() {
  return {
    authorization: `Bearer ${token("admin")}`,
    "content-type": "application/json"
  };
}

test("admin routes require an authenticated admin role", async () => {
  await withServer(async (baseUrl) => {
    const missingAuth = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(missingAuth.status, 401);

    const clientAuth = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token("client")}` }
    });
    const payload = await clientAuth.json();

    assert.equal(clientAuth.status, 403);
    assert.equal(payload.message, "Forbidden: admin role required");
  });
});

test("admin metrics and paginated users expose moderation context", async () => {
  await withServer(async (baseUrl) => {
    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, { headers: adminHeaders() });
    const metrics = await metricsResponse.json();
    assert.equal(metricsResponse.status, 200);
    assert.equal(metrics.data.totalUsers, 4);
    assert.equal(metrics.data.openDisputes, 2);
    assert.equal(metrics.data.trustDistribution.length, 3);

    const usersResponse = await fetch(`${baseUrl}/api/admin/users?role=client&page=1&pageSize=1`, { headers: adminHeaders() });
    const users = await usersResponse.json();
    assert.equal(usersResponse.status, 200);
    assert.equal(users.data.pageSize, 1);
    assert.equal(users.data.total, 2);
    assert.equal(users.data.items[0].role, "client");
  });
});

test("admin actions update state and append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "manual review" })
    });
    const status = await statusResponse.json();
    assert.equal(statusResponse.status, 200);
    assert.equal(status.data.status, "suspended");

    const controlResponse = await fetch(`${baseUrl}/api/admin/controls/jobPostings`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    const control = await controlResponse.json();
    assert.equal(controlResponse.status, 200);
    assert.equal(control.data.enabled, false);

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit?actionType=platform.control`, { headers: adminHeaders() });
    const audit = await auditResponse.json();
    assert.equal(auditResponse.status, 200);
    assert.equal(audit.data.total, 1);
    assert.equal(audit.data.items[0].targetId, "jobPostings");
  });
});
