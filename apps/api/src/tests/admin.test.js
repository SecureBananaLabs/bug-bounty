import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

let server;
let baseUrl;

const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });

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

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  return { response, payload };
}

test("admin routes reject missing and non-admin tokens", async () => {
  const anonymous = await request("/api/admin/overview");
  assert.equal(anonymous.response.status, 401);
  assert.equal(anonymous.payload.success, false);

  const client = await request("/api/admin/overview", { token: clientToken });
  assert.equal(client.response.status, 403);
  assert.equal(client.payload.message, "Forbidden: admin access required");
});

test("GET /api/admin/overview returns dashboard metrics and controls", async () => {
  const { response, payload } = await request("/api/admin/overview", { token: adminToken });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.totals.totalUsers, 6);
  assert.equal(payload.data.totals.flaggedListings, 2);
  assert.equal(payload.data.trustDistribution.length, 4);
  assert.deepEqual(payload.data.platformControls, {
    registrationsEnabled: true,
    jobPostingsEnabled: true
  });
});

test("GET /api/admin/users supports server-side role filtering and pagination", async () => {
  const { response, payload } = await request("/api/admin/users?role=freelancer&page=1&pageSize=2", {
    token: adminToken
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.items.length, 2);
  assert.equal(payload.data.pagination.total, 3);
  assert.equal(payload.data.items.every((user) => user.role === "freelancer"), true);
});

test("admin can update user status and action appears in audit log", async () => {
  const update = await request("/api/admin/users/usr_client_1/status", {
    method: "PATCH",
    token: adminToken,
    body: { status: "suspended" }
  });

  assert.equal(update.response.status, 200);
  assert.equal(update.payload.data.user.status, "suspended");
  assert.equal(update.payload.data.audit.action, "user.suspended");

  const audit = await request("/api/admin/audit?action=user.suspended", { token: adminToken });
  assert.equal(audit.response.status, 200);
  assert.equal(audit.payload.data.items[0].targetId, "usr_client_1");
});

test("admin can reject a flagged listing and notify the posting user", async () => {
  const { response, payload } = await request("/api/admin/moderation/job_102", {
    method: "PATCH",
    token: adminToken,
    body: { decision: "rejected", reason: "Prohibited credential collection wording." }
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.job.status, "rejected");
  assert.equal(payload.data.notification.type, "listing_rejected");
  assert.equal(payload.data.audit.action, "listing.rejected");
});

test("admin can rule on disputes and platform controls require booleans", async () => {
  const ruling = await request("/api/admin/disputes/disp_501/ruling", {
    method: "PATCH",
    token: adminToken,
    body: { ruling: "client", notes: "Evidence supports refund." }
  });

  assert.equal(ruling.response.status, 200);
  assert.equal(ruling.payload.data.dispute.status, "resolved");
  assert.equal(ruling.payload.data.refundTriggered, true);

  const invalidControl = await request("/api/admin/controls/registrationsEnabled", {
    method: "PATCH",
    token: adminToken,
    body: { enabled: "false" }
  });
  assert.equal(invalidControl.response.status, 400);

  const validControl = await request("/api/admin/controls/registrationsEnabled", {
    method: "PATCH",
    token: adminToken,
    body: { enabled: false }
  });
  assert.equal(validControl.response.status, 200);
  assert.equal(validControl.payload.data.controls.registrationsEnabled, false);
});
