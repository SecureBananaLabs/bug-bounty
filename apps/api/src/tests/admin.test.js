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

function adminHeaders(role = "admin") {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${signAccessToken({ sub: `test_${role}`, role })}`
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

test("admin can update user status and audit the action", async () => {
  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "test suspension" })
    });
    const updatePayload = await update.json();

    assert.equal(update.status, 200);
    assert.equal(updatePayload.data.status, "suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit-log`, {
      headers: adminHeaders()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items[0].action, "admin.user.suspended");
    assert.equal(auditPayload.data.items[0].targetId, "usr_client_1");
  });
});

test("platform controls require explicit confirmation", async () => {
  await withServer(async (baseUrl) => {
    const rejected = await fetch(`${baseUrl}/api/admin/platform-controls`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ control: "registrationEnabled", enabled: false })
    });
    const rejectedPayload = await rejected.json();

    assert.equal(rejected.status, 400);
    assert.match(rejectedPayload.message, /confirm/);

    const accepted = await fetch(`${baseUrl}/api/admin/platform-controls`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        control: "registrationEnabled",
        enabled: false,
        confirm: true,
        reason: "test toggle"
      })
    });
    const acceptedPayload = await accepted.json();

    assert.equal(accepted.status, 200);
    assert.equal(acceptedPayload.data.registrationEnabled, false);
  });
});
