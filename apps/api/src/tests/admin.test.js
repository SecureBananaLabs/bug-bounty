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

function adminToken() {
  return signAccessToken({ sub: "admin_1", role: "admin" });
}

function clientToken() {
  return signAccessToken({ sub: "client_1", role: "client" });
}

async function request(baseUrl, path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (body) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();
  return { response, payload };
}

test("admin API rejects non-admins and exposes operations data to admins", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await request(baseUrl, "/api/admin/overview");
    assert.equal(anonymous.response.status, 401);

    const nonAdmin = await request(baseUrl, "/api/admin/overview", { token: clientToken() });
    assert.equal(nonAdmin.response.status, 403);

    const overview = await request(baseUrl, "/api/admin/overview", { token: adminToken() });
    assert.equal(overview.response.status, 200);
    assert.equal(overview.payload.success, true);
    assert.equal(typeof overview.payload.data.metrics.monthlyVolume, "number");
    assert.equal(overview.payload.data.queues.flaggedJobs, 1);
  });
});

test("admin API supports filtering, status actions, controls, and audit entries", async () => {
  await withServer(async (baseUrl) => {
    const token = adminToken();

    const filteredUsers = await request(baseUrl, "/api/admin/users?q=maya", { token });
    assert.equal(filteredUsers.response.status, 200);
    assert.equal(filteredUsers.payload.data.total, 1);
    assert.equal(filteredUsers.payload.data.items[0].id, "usr_101");

    const updatedUser = await request(baseUrl, "/api/admin/users/usr_103/status", {
      method: "PATCH",
      token,
      body: { status: "suspended", reason: "Manual review failed" }
    });
    assert.equal(updatedUser.response.status, 200);
    assert.equal(updatedUser.payload.data.status, "suspended");

    const updatedControls = await request(baseUrl, "/api/admin/controls", {
      method: "PATCH",
      token,
      body: { maintenanceMode: true }
    });
    assert.equal(updatedControls.response.status, 200);
    assert.equal(updatedControls.payload.data.maintenanceMode, true);

    const audit = await request(baseUrl, "/api/admin/audit?q=user_status_suspended", { token });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items[0].target, "usr_103");
  });
});
