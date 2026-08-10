import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { store } from "../config/db.js";

// Helper to make requests
async function makeRequest(app, path, method = "GET", body = null, token = null) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${path}`;
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const payload = await response.json();
  await new Promise((resolve) => server.close(resolve));
  return { status: response.status, payload };
}

test("Admin route protection - non-admins blocked with 403", async () => {
  const app = createApp();
  // client token
  const clientToken = signAccessToken({ sub: "usr_client1", role: "CLIENT" });
  const { status, payload } = await makeRequest(app, "/api/admin/metrics", "GET", null, clientToken);
  assert.equal(status, 403);
  assert.equal(payload.success, false);
  assert.match(payload.message, /Forbidden/i);
});

test("Admin route protection - admins allowed", async () => {
  const app = createApp();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "ADMIN" });
  const { status, payload } = await makeRequest(app, "/api/admin/metrics", "GET", null, adminToken);
  assert.equal(status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.summary);
});

test("User management - table of users with pagination and search", async () => {
  const app = createApp();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "ADMIN" });
  const { status, payload } = await makeRequest(app, "/api/admin/users?search=maya&role=FREELANCER", "GET", null, adminToken);
  assert.equal(status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.users.length, 1);
  assert.equal(payload.data.users[0].fullName, "Maya Dev");
});

test("User management - suspend and reinstate user accounts", async () => {
  const app = createApp();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "ADMIN" });
  
  // Suspend
  const { status: status1, payload: payload1 } = await makeRequest(
    app,
    "/api/admin/users/usr_free1/status",
    "POST",
    { status: "SUSPENDED" },
    adminToken
  );
  assert.equal(status1, 200);
  assert.equal(payload1.data.status, "SUSPENDED");

  // Check audit log contains SUSPEND
  const { status: statusLog, payload: payloadLog } = await makeRequest(app, "/api/admin/logs", "GET", null, adminToken);
  assert.equal(statusLog, 200);
  assert.ok(payloadLog.data.some(l => l.action === "USER_SUSPENDED"));
});

test("Job moderation - moderate a flagged job", async () => {
  const app = createApp();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "ADMIN" });

  const { status, payload } = await makeRequest(
    app,
    "/api/admin/jobs/job_2/moderate",
    "POST",
    { action: "REJECT", reason: "Spam content" },
    adminToken
  );
  assert.equal(status, 200);
  assert.equal(payload.data.status, "REJECTED");
});

test("Dispute resolution - resolve dispute thread", async () => {
  const app = createApp();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "ADMIN" });

  const { status, payload } = await makeRequest(
    app,
    "/api/admin/disputes/dis_1/resolve",
    "POST",
    { decision: "RESOLVED", refundPercent: 100 },
    adminToken
  );
  assert.equal(status, 200);
  assert.equal(payload.data.status, "RESOLVED");
});

test("Platform controls - enable/disable registration & postings", async () => {
  const app = createApp();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "ADMIN" });

  const { status, payload } = await makeRequest(
    app,
    "/api/admin/controls",
    "POST",
    { key: "registration_enabled", value: false },
    adminToken
  );
  assert.equal(status, 200);
  assert.equal(payload.data.value, "false");
});
