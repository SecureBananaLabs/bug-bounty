import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("admin routes enforce authentication and admin role", async () => {
  const { baseUrl, close } = await startServer();

  const anonymous = await fetch(`${baseUrl}/api/admin/users`);
  assert.equal(anonymous.status, 401);

  const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
  const forbidden = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(forbidden.status, 403);

  await close();
});

test("admin routes support pagination, moderation actions, controls, and audit log", async () => {
  const { baseUrl, close } = await startServer();
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  const authHeaders = { Authorization: `Bearer ${token}` };

  const users = await getJson(`${baseUrl}/api/admin/users?page=1&limit=2&role=freelancer`, authHeaders);
  assert.equal(users.success, true);
  assert.equal(users.data.page, 1);
  assert.equal(users.data.limit, 2);
  assert.ok(users.data.total >= 2);
  assert.ok(users.data.data.every((user) => user.role === "freelancer"));

  const action = await postJson(`${baseUrl}/api/admin/users/usr_1003/actions`, {
    action: "suspend",
    reason: "Repeated marketplace policy violations"
  }, authHeaders);
  assert.equal(action.success, true);
  assert.equal(action.data.status, "suspended");

  const control = await postJson(`${baseUrl}/api/admin/platform-controls/job_posting`, {
    enabled: false,
    reason: "Temporary moderation pause"
  }, authHeaders);
  assert.equal(control.success, true);
  assert.equal(control.data.enabled, false);

  const dispute = await postJson(`${baseUrl}/api/admin/disputes/dsp_3001/resolve`, {
    resolution: "split_payment",
    note: "Both parties accepted a partial release"
  }, authHeaders);
  assert.equal(dispute.success, true);
  assert.equal(dispute.data.status, "resolved");

  const audit = await getJson(`${baseUrl}/api/admin/audit-log?page=1&limit=5`, authHeaders);
  assert.equal(audit.success, true);
  assert.ok(audit.data.data.some((event) => event.type === "platform_control.updated"));
  assert.ok(audit.data.data.some((event) => event.type === "dispute.resolved"));

  await close();
});

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function getJson(url, headers) {
  const response = await fetch(url, { headers });
  return response.json();
}

async function postJson(url, body, headers) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return response.json();
}
