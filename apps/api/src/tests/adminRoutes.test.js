import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startServer() {
  const app = createApp();
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

async function withServer(callback) {
  const server = await startServer();
  const { port } = server.address();

  try {
    return await callback(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject non-admin tokens", async () => {
  const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });

  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/overview`, {
      headers: authHeaders(clientToken)
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Admin access required");
  });
});

test("admin overview and user status updates are available to admins", async () => {
  const adminToken = signAccessToken({ sub: "usr_admin_1", role: "admin" });

  await withServer(async (port) => {
    const overviewResponse = await fetch(`http://127.0.0.1:${port}/api/admin/overview`, {
      headers: authHeaders(adminToken)
    });
    const overviewPayload = await overviewResponse.json();

    assert.equal(overviewResponse.status, 200);
    assert.equal(overviewPayload.data.summary.totalUsers, 5);
    assert.equal(overviewPayload.data.summary.flaggedListings, 2);

    const updateResponse = await fetch(`http://127.0.0.1:${port}/api/admin/users/usr-client-2/status`, {
      method: "PATCH",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ action: "reinstate", reason: "Cleared in review" })
    });
    const updatePayload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updatePayload.data.user.status, "active");

    const usersResponse = await fetch(`http://127.0.0.1:${port}/api/admin/users?status=active&q=Riley`, {
      headers: authHeaders(adminToken)
    });
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.total, 1);
    assert.equal(usersPayload.data.items[0].id, "usr-client-2");
  });
});

test("admin controls update the platform state and record an audit event", async () => {
  const adminToken = signAccessToken({ sub: "usr_admin_1", role: "admin" });

  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/controls/registrationsEnabled`, {
      method: "PATCH",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ enabled: false })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.enabled, false);

    const controlsResponse = await fetch(`http://127.0.0.1:${port}/api/admin/controls`, {
      headers: authHeaders(adminToken)
    });
    const controlsPayload = await controlsResponse.json();

    assert.equal(controlsPayload.data.registrationsEnabled, false);

    const auditResponse = await fetch(`http://127.0.0.1:${port}/api/admin/audit-log?q=control-registrationsEnabled`, {
      headers: authHeaders(adminToken)
    });
    const auditPayload = await auditResponse.json();

    assert.ok(auditPayload.data.total >= 1);
    assert.equal(auditPayload.data.items[0].action, "control-registrationsEnabled");
  });
});
