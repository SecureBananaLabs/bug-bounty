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

function authHeaders(role = "admin") {
  const token = signAccessToken({ sub: `${role}_1`, role, name: `${role} user` });
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

test("admin routes reject authenticated non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.match(payload.message, /admin/i);
  });
});

test("admin users endpoint supports server-side filters and pagination", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/admin/users?role=freelancer&status=active&page=1&pageSize=2`,
      { headers: authHeaders() }
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.page, 1);
    assert.equal(payload.data.pageSize, 2);
    assert.ok(payload.data.total >= 2);
    assert.equal(payload.data.items.length, 2);
    assert.ok(payload.data.items.every((user) => user.role === "freelancer"));
    assert.ok(payload.data.items.every((user) => user.status === "active"));
  });
});

test("admin user status changes are persisted and written to the audit log", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_03/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Escrow review hold" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.status, "suspended");
    assert.equal(payload.data.id, "usr_03");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=user.status_changed`, {
      headers: authHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.ok(auditPayload.data.items.some((entry) => entry.targetId === "usr_03"));
  });
});

test("admin platform control updates require a reason and create an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const missingReason = await fetch(`${baseUrl}/api/admin/platform-controls/registrations`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(missingReason.status, 400);

    const response = await fetch(`${baseUrl}/api/admin/platform-controls/registrations`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ enabled: false, reason: "Fraud spike review" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.enabled, false);
    assert.equal(payload.data.key, "registrations");

    const auditResponse = await fetch(
      `${baseUrl}/api/admin/audit-log?action=platform_control.updated`,
      { headers: authHeaders() }
    );
    const auditPayload = await auditResponse.json();

    assert.ok(auditPayload.data.items.some((entry) => entry.targetId === "registrations"));
  });
});
