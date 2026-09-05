import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const adminToken = signAccessToken({ sub: "usr_admin_test", role: "admin" });
const clientToken = signAccessToken({ sub: "usr_client_test", role: "client" });

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders() {
  return {
    authorization: `Bearer ${adminToken}`,
    "content-type": "application/json"
  };
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json();
  return { response, payload };
}

test("admin routes require an authenticated admin token", async () => {
  await withServer(async (baseUrl) => {
    const unauthorized = await requestJson(baseUrl, "/api/admin/metrics");
    assert.equal(unauthorized.response.status, 401);
    assert.equal(unauthorized.payload.message, "Unauthorized");

    const forbidden = await requestJson(baseUrl, "/api/admin/metrics", {
      headers: {
        authorization: `Bearer ${clientToken}`
      }
    });
    assert.equal(forbidden.response.status, 403);
    assert.equal(forbidden.payload.message, "Forbidden");
  });
});

test("admin metrics and user list return paginated operational data", async () => {
  await withServer(async (baseUrl) => {
    const metrics = await requestJson(baseUrl, "/api/admin/metrics", {
      headers: adminHeaders()
    });
    assert.equal(metrics.response.status, 200);
    assert.equal(metrics.payload.data.totalUsers, 4);
    assert.equal(metrics.payload.data.flaggedListings, 2);
    assert.equal(metrics.payload.data.trustScoreDistribution.length, 4);

    const users = await requestJson(baseUrl, "/api/admin/users?role=freelancer&pageSize=1", {
      headers: adminHeaders()
    });
    assert.equal(users.response.status, 200);
    assert.equal(users.payload.data.pageSize, 1);
    assert.equal(users.payload.data.total, 2);
    assert.equal(users.payload.data.items.length, 1);
    assert.equal(users.payload.data.items[0].role, "freelancer");
  });
});

test("admins can update user status and inspect the audit entry", async () => {
  await withServer(async (baseUrl) => {
    const update = await requestJson(baseUrl, "/api/admin/users/usr_client_1/status", {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({
        status: "suspended",
        reason: "Chargeback investigation"
      })
    });
    assert.equal(update.response.status, 200);
    assert.equal(update.payload.data.status, "suspended");

    const profile = await requestJson(baseUrl, "/api/admin/users/usr_client_1", {
      headers: adminHeaders()
    });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.payload.data.statusReason, "Chargeback investigation");
    assert.equal(profile.payload.data.disputes.length, 1);

    const audit = await requestJson(baseUrl, "/api/admin/audit?actionType=user.suspended", {
      headers: adminHeaders()
    });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items[0].adminId, "usr_admin_test");
  });
});

test("admins can reject flagged listings and notify the posting user", async () => {
  await withServer(async (baseUrl) => {
    const decision = await requestJson(baseUrl, "/api/admin/moderation/mod_1/decision", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        decision: "reject",
        reason: "Listing requests payment credentials"
      })
    });
    assert.equal(decision.response.status, 200);
    assert.equal(decision.payload.data.status, "rejected");
    assert.equal(decision.payload.data.notifications[0].userId, "usr_client_2");

    const rejected = await requestJson(baseUrl, "/api/admin/moderation?status=rejected", {
      headers: adminHeaders()
    });
    assert.equal(rejected.response.status, 200);
    assert.equal(rejected.payload.data.items[0].id, "mod_1");
  });
});

test("admins can inspect and resolve disputes with notifications", async () => {
  await withServer(async (baseUrl) => {
    const detail = await requestJson(baseUrl, "/api/admin/disputes/dsp_1", {
      headers: adminHeaders()
    });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.payload.data.thread.length, 2);
    assert.equal(detail.payload.data.evidence.length, 2);

    const ruling = await requestJson(baseUrl, "/api/admin/disputes/dsp_1/ruling", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        ruling: "refund",
        reason: "Refund milestone while scope evidence is reviewed"
      })
    });
    assert.equal(ruling.response.status, 200);
    assert.equal(ruling.payload.data.status, "resolved");
    assert.equal(ruling.payload.data.notifications[0].userIds.length, 2);
  });
});

test("platform toggles require changes and append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const settings = await requestJson(baseUrl, "/api/admin/settings", {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({
        jobPostingEnabled: false,
        reason: "Pause new jobs during moderation review"
      })
    });
    assert.equal(settings.response.status, 200);
    assert.equal(settings.payload.data.jobPostingEnabled, false);
    assert.deepEqual(settings.payload.data.changedSettings, ["jobPostingEnabled"]);

    const audit = await requestJson(baseUrl, "/api/admin/audit?actionType=settings.jobPostingEnabled", {
      headers: adminHeaders()
    });
    assert.equal(audit.response.status, 200);
    assert.equal(audit.payload.data.items[0].targetId, "platform");
  });
});
