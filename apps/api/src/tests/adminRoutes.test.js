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

function headers(role = "admin") {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: headers("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin overview returns metrics and controls", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: headers()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.metrics.totalUsers, "number");
    assert.equal(typeof payload.data.platformControls.registrationsEnabled, "boolean");
  });
});

test("admin actions update records and append audit rows", async () => {
  await withServer(async (baseUrl) => {
    const action = await fetch(`${baseUrl}/api/admin/users/usr_003/status`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "active" })
    });
    const actionPayload = await action.json();

    assert.equal(action.status, 200);
    assert.equal(actionPayload.data.user.status, "active");
    assert.equal(actionPayload.data.audit.action, "user.active");

    const audit = await fetch(`${baseUrl}/api/admin/audit?action=user`, {
      headers: headers()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.ok(auditPayload.data.items.some((entry) => entry.action === "user.active"));
  });
});
