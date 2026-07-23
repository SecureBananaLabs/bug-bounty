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

function adminHeaders() {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: "usr_admin_1", role: "admin" })}`
  };
}

test("admin routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client_1", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Admin access required");
  });
});

test("admin overview returns operations metrics for admins", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.metrics.totalUsers, 6);
    assert.equal(payload.data.trustDistribution.length, 3);
  });
});

test("admin can search and suspend users with an audit entry", async () => {
  await withServer(async (baseUrl) => {
    const searchResponse = await fetch(`${baseUrl}/api/admin/users?search=avery&page=1&pageSize=2`, {
      headers: adminHeaders()
    });
    const searchPayload = await searchResponse.json();

    assert.equal(searchResponse.status, 200);
    assert.equal(searchPayload.data.total, 1);
    assert.equal(searchPayload.data.items[0].id, "usr_client_1");

    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "PATCH",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "suspend", reason: "Suspicious dispute pattern" })
    });
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.user.status, "suspended");
    assert.equal(statusPayload.data.audit.actionType, "user.suspend");
  });
});

test("admin can update platform controls", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/controls/jobPostingsEnabled`, {
      method: "PATCH",
      headers: {
        ...adminHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ enabled: false })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.controls.jobPostingsEnabled, false);
    assert.equal(payload.data.audit.actionType, "platform.jobPostingsEnabled");
  });
});
