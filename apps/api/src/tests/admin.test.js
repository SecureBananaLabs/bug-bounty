import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("admin routes require authenticated admin role", async () => {
  const { baseUrl, close } = await startApp();

  const anonymous = await fetch(`${baseUrl}/api/admin/metrics`);
  assert.equal(anonymous.status, 401);

  const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
  const forbidden = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(forbidden.status, 403);

  await close();
});

test("admin can filter users and mutate account status with audit logging", async () => {
  const { baseUrl, close } = await startApp();
  const headers = adminHeaders();

  const usersResponse = await fetch(`${baseUrl}/api/admin/users?role=client&pageSize=1`, { headers });
  const usersPayload = await usersResponse.json();
  assert.equal(usersResponse.status, 200);
  assert.equal(usersPayload.data.pageSize, 1);
  assert.equal(usersPayload.data.items[0].role, "client");

  const actionResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_1/actions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "suspend", reason: "Manual risk review" })
  });
  const actionPayload = await actionResponse.json();
  assert.equal(actionResponse.status, 200);
  assert.equal(actionPayload.data.status, "suspended");

  const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?actionType=user.suspend`, { headers });
  const auditPayload = await auditResponse.json();
  assert.equal(auditResponse.status, 200);
  assert.equal(auditPayload.data.items[0].actionType, "user.suspend");

  await close();
});

test("admin moderation, dispute, and platform actions update state", async () => {
  const { baseUrl, close } = await startApp();
  const headers = adminHeaders();

  const moderationResponse = await fetch(`${baseUrl}/api/admin/flagged-jobs/job_103/actions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "reject", reason: "Suspicious payment language" })
  });
  const moderationPayload = await moderationResponse.json();
  assert.equal(moderationResponse.status, 200);
  assert.equal(moderationPayload.data.status, "rejected");

  const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_301/actions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "refund", reason: "Evidence supports refund" })
  });
  const disputePayload = await disputeResponse.json();
  assert.equal(disputeResponse.status, 200);
  assert.equal(disputePayload.data.status, "resolved");
  assert.equal(disputePayload.data.ruling, "refund");

  const settingsResponse = await fetch(`${baseUrl}/api/admin/settings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ registrationsEnabled: false, jobPostingEnabled: true })
  });
  const settingsPayload = await settingsResponse.json();
  assert.equal(settingsResponse.status, 200);
  assert.equal(settingsPayload.data.registrationsEnabled, false);

  await close();
});

function adminHeaders() {
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

async function startApp() {
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
      server.close(error => (error ? reject(error) : resolve()));
    })
  };
}
