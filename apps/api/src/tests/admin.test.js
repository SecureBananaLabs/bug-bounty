import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function token(role = "admin") {
  return signAccessToken({ sub: `test-${role}`, role });
}

async function api(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    method: options.method ?? "GET",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return { response, payload: await response.json() };
}

test("admin routes require an admin token", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await api(baseUrl, "/api/admin/metrics");
    assert.equal(anonymous.response.status, 401);

    const client = await api(baseUrl, "/api/admin/metrics", { token: token("client") });
    assert.equal(client.response.status, 403);
  });
});

test("admin metrics and paginated user search are available to admins", async () => {
  await withServer(async (baseUrl) => {
    const metrics = await api(baseUrl, "/api/admin/metrics", { token: token() });
    assert.equal(metrics.response.status, 200);
    assert.equal(metrics.payload.data.totalUsers, 5);
    assert.equal(metrics.payload.data.flaggedListings, 2);

    const users = await api(baseUrl, "/api/admin/users?role=freelancer&page=1&pageSize=1", { token: token() });
    assert.equal(users.response.status, 200);
    assert.equal(users.payload.data.items.length, 1);
    assert.equal(users.payload.data.total, 2);
    assert.equal(users.payload.data.totalPages, 2);
  });
});

test("admin actions update records and append audit events", async () => {
  await withServer(async (baseUrl) => {
    const status = await api(baseUrl, "/api/admin/users/usr_freelancer_2/status", {
      token: token(),
      method: "PATCH",
      body: { status: "suspended" }
    });
    assert.equal(status.response.status, 200);
    assert.equal(status.payload.data.user.status, "suspended");
    assert.equal(status.payload.data.audit.actionType, "user.suspended");

    const listing = await api(baseUrl, "/api/admin/moderation/listings/flg_2", {
      token: token(),
      method: "PATCH",
      body: { decision: "rejected", reason: "Bulk email compliance risk requires a smaller approved sample." }
    });
    assert.equal(listing.response.status, 200);
    assert.equal(listing.payload.data.listing.status, "rejected");
    assert.equal(listing.payload.data.notification.userId, "usr_client_2");

    const audit = await api(baseUrl, "/api/admin/audit-log?actionType=user&pageSize=5", { token: token() });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items[0].actionType, "user.suspended");
  });
});

test("dispute rulings notify both parties and platform controls are audited", async () => {
  await withServer(async (baseUrl) => {
    const ruling = await api(baseUrl, "/api/admin/disputes/dsp_1/ruling", {
      token: token(),
      method: "PATCH",
      body: { ruling: "refund", note: "Evidence supports refunding the held milestone." }
    });
    assert.equal(ruling.response.status, 200);
    assert.equal(ruling.payload.data.dispute.status, "resolved");
    assert.equal(ruling.payload.data.notifications.length, 2);

    const control = await api(baseUrl, "/api/admin/controls/jobPostings", {
      token: token(),
      method: "PATCH",
      body: { enabled: false }
    });
    assert.equal(control.response.status, 200);
    assert.equal(control.payload.data.control.enabled, false);
    assert.equal(control.payload.data.audit.targetId, "jobPostings");
  });
});
