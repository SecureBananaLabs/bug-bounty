import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { resetAdminDataForTests } from "../services/adminService.js";
import { signAccessToken } from "../utils/jwt.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  resetAdminDataForTests();
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function accessToken(role = "admin") {
  return signAccessToken({ sub: `test_${role}`, role });
}

async function request(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };

  if (options.token !== false) {
    headers.authorization = `Bearer ${options.token ?? accessToken()}`;
  }

  if (options.body) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return { response, payload: await response.json() };
}

test("admin routes require an authenticated admin", async () => {
  const unauthorized = await request("/api/admin/metrics", { token: false });
  assert.equal(unauthorized.response.status, 401);

  const forbidden = await request("/api/admin/metrics", { token: accessToken("client") });
  assert.equal(forbidden.response.status, 403);
});

test("GET /api/admin/metrics returns dashboard metrics", async () => {
  const { response, payload } = await request("/api/admin/metrics");

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.totalUsers, 6);
  assert.equal(payload.data.flaggedListings, 2);
  assert.ok(Array.isArray(payload.data.trustDistribution));
});

test("GET /api/admin/users supports server-side filters and pagination", async () => {
  const { response, payload } = await request("/api/admin/users?search=Amara&page=1&pageSize=1");

  assert.equal(response.status, 200);
  assert.equal(payload.data.total, 1);
  assert.equal(payload.data.items[0].id, "usr_client_1");
  assert.equal(payload.data.pageSize, 1);
});

test("PATCH /api/admin/users/:id/status updates users and appends audit logs", async () => {
  const update = await request("/api/admin/users/usr_client_1/status", {
    method: "PATCH",
    body: { action: "suspend", reason: "chargeback investigation" }
  });
  assert.equal(update.response.status, 200);
  assert.equal(update.payload.data.user.status, "suspended");
  assert.equal(update.payload.data.auditLog.actionType, "user.suspend");

  const audit = await request("/api/admin/audit-logs?actionType=user.suspend");
  assert.equal(audit.payload.data.total, 1);
  assert.equal(audit.payload.data.items[0].targetId, "usr_client_1");
});

test("POST /api/admin/moderation/jobs/:id/decision rejects flagged listings with notification reason", async () => {
  const { response, payload } = await request("/api/admin/moderation/jobs/job_102/decision", {
    method: "POST",
    body: { action: "reject", reason: "Policy violation" }
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.job.status, "rejected");
  assert.equal(payload.data.notification.type, "job_rejected");
  assert.match(payload.data.notification.message, /Policy violation/);
});

test("POST /api/admin/disputes/:id/ruling resolves disputes and notifies both parties", async () => {
  const { response, payload } = await request("/api/admin/disputes/dsp_201/ruling", {
    method: "POST",
    body: { resolution: "refund", notes: "Client evidence supports refund" }
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.dispute.status, "resolved");
  assert.equal(payload.data.dispute.transaction.refundStatus, "queued");
  assert.equal(payload.data.notifications.length, 2);
});

test("PATCH /api/admin/controls/:controlName requires booleans and logs changes", async () => {
  const { response, payload } = await request("/api/admin/controls/registrationsEnabled", {
    method: "PATCH",
    body: { enabled: false }
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.controls.registrationsEnabled, false);
  assert.equal(payload.data.auditLog.actionType, "control.registrationsEnabled");

  const invalid = await request("/api/admin/controls/jobPostingsEnabled", {
    method: "PATCH",
    body: { enabled: "no" }
  });
  assert.equal(invalid.response.status, 422);
});
