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

function auth(role = "admin") {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "Content-Type": "application/json"
  };
}

test("admin endpoints reject anonymous and non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(anonymous.status, 401);

    const nonAdmin = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: auth("client")
    });
    const payload = await nonAdmin.json();

    assert.equal(nonAdmin.status, 403);
    assert.equal(payload.message, "Forbidden");
  });
});

test("admin metrics and paginated users are available to admins", async () => {
  await withServer(async (baseUrl) => {
    const metrics = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: auth()
    });
    const metricsPayload = await metrics.json();

    assert.equal(metrics.status, 200);
    assert.equal(metricsPayload.data.totalUsers, 3);
    assert.equal(metricsPayload.data.trustBands.high, 2);

    const users = await fetch(`${baseUrl}/api/admin/users?role=client&pageSize=1`, {
      headers: auth()
    });
    const usersPayload = await users.json();

    assert.equal(users.status, 200);
    assert.equal(usersPayload.data.total, 2);
    assert.equal(usersPayload.data.items.length, 1);
    assert.equal(usersPayload.data.items[0].role, "client");
  });
});

test("admin mutations update state and append audit events", async () => {
  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_client_001/status`, {
      method: "PATCH",
      headers: auth(),
      body: JSON.stringify({ status: "suspended", reason: "manual review" })
    });
    const updatePayload = await update.json();

    assert.equal(update.status, 200);
    assert.equal(updatePayload.data.user.status, "suspended");
    assert.equal(updatePayload.data.audit.action, "user.suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit?action=user`, {
      headers: auth()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_client_001");
  });
});

test("platform controls validate boolean state and are audit logged", async () => {
  await withServer(async (baseUrl) => {
    const bad = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: auth(),
      body: JSON.stringify({ enabled: "nope" })
    });
    assert.equal(bad.status, 400);

    const updated = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: auth(),
      body: JSON.stringify({ enabled: false, reason: "maintenance window" })
    });
    const payload = await updated.json();

    assert.equal(updated.status, 200);
    assert.equal(payload.data.control.enabled, false);
    assert.equal(payload.data.audit.action, "control.disabled");
  });
});
