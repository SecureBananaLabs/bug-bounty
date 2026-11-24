import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const app = createApp();
const server = app.listen(0);

await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("admin routes reject unauthenticated and non-admin callers", async () => {
  const baseUrl = getBaseUrl();

  const missingAuth = await fetch(`${baseUrl}/api/admin/metrics`);
  assert.equal(missingAuth.status, 401);

  const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
  const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(clientResponse.status, 403);
});

test("admin metrics and user pagination are available to admins", async () => {
  const baseUrl = getBaseUrl();
  const response = await adminFetch(`${baseUrl}/api/admin/metrics`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.totalUsers, 4);
  assert.equal(payload.data.openDisputes, 2);
  assert.ok(Array.isArray(payload.data.trustDistribution));

  const users = await adminFetch(`${baseUrl}/api/admin/users?role=freelancer&pageSize=1`);
  const usersPayload = await users.json();

  assert.equal(users.status, 200);
  assert.equal(usersPayload.data.items.length, 1);
  assert.equal(usersPayload.data.total, 2);
  assert.equal(usersPayload.data.totalPages, 2);
});

test("admin mutations update records and append audit entries", async () => {
  const baseUrl = getBaseUrl();
  const statusResponse = await adminFetch(`${baseUrl}/api/admin/users/usr_freelancer_1/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "suspended", reason: "Policy review" })
  });
  const statusPayload = await statusResponse.json();

  assert.equal(statusResponse.status, 200);
  assert.equal(statusPayload.data.status, "suspended");

  const controlsResponse = await adminFetch(`${baseUrl}/api/admin/controls`, {
    method: "PATCH",
    body: JSON.stringify({ registrationsEnabled: false, jobPostingEnabled: true })
  });
  const controlsPayload = await controlsResponse.json();

  assert.equal(controlsResponse.status, 200);
  assert.equal(controlsPayload.data.registrationsEnabled, false);

  const auditResponse = await adminFetch(`${baseUrl}/api/admin/audit?pageSize=5`);
  const auditPayload = await auditResponse.json();
  const actions = auditPayload.data.items.map((entry) => entry.action);

  assert.equal(auditResponse.status, 200);
  assert.ok(actions.includes("user.status"));
  assert.ok(actions.includes("controls.update"));
});

test("admin moderation and dispute actions update queue state", async () => {
  const baseUrl = getBaseUrl();
  const moderationResponse = await adminFetch(`${baseUrl}/api/admin/moderation/mod_101/decision`, {
    method: "POST",
    body: JSON.stringify({ decision: "rejected", reason: "Prohibited access request" })
  });
  const moderationPayload = await moderationResponse.json();

  assert.equal(moderationResponse.status, 200);
  assert.equal(moderationPayload.data.status, "rejected");
  assert.equal(moderationPayload.data.notified, true);

  const disputeResponse = await adminFetch(`${baseUrl}/api/admin/disputes/dsp_201/ruling`, {
    method: "POST",
    body: JSON.stringify({ outcome: "refund", note: "Evidence supports client refund" })
  });
  const disputePayload = await disputeResponse.json();

  assert.equal(disputeResponse.status, 200);
  assert.equal(disputePayload.data.status, "resolved");
  assert.equal(disputePayload.data.ruling.outcome, "refund");
});

function getBaseUrl() {
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

function adminFetch(url, options = {}) {
  const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
}
