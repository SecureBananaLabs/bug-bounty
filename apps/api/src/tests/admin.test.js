import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertion) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await assertion(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders(role = "admin") {
  return {
    authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "content-type": "application/json"
  };
}

test("admin routes require authentication and admin role", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await fetch(`${baseUrl}/api/admin/dashboard`);
    assert.equal(anonymous.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: adminHeaders("client")
    });
    assert.equal(client.status, 403);
  });
});

test("admin dashboard returns metrics, trust distribution, queues, and controls", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: adminHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.metrics.totalUsers, 4);
    assert.equal(payload.data.metrics.flaggedListings, 1);
    assert.equal(payload.data.controls.registrationsEnabled, true);
    assert.deepEqual(payload.data.trustDistribution.map((bucket) => bucket.label), ["0-49", "50-79", "80-100"]);
  });
});

test("admins can search users and moderate account status", async () => {
  await withServer(async (baseUrl) => {
    const search = await fetch(`${baseUrl}/api/admin/users?role=client&status=active&search=northstar`, {
      headers: adminHeaders()
    });
    const searchPayload = await search.json();

    assert.equal(search.status, 200);
    assert.equal(searchPayload.data.length, 1);
    assert.equal(searchPayload.data[0].id, "usr_client_1");

    const suspend = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "suspend" })
    });
    const suspendPayload = await suspend.json();

    assert.equal(suspend.status, 200);
    assert.equal(suspendPayload.data.status, "suspended");

    const unsupported = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "archive" })
    });

    assert.equal(unsupported.status, 400);
  });
});

test("admins can reject flagged listings and notify posting users", async () => {
  await withServer(async (baseUrl) => {
    const reject = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_website_refresh`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Off-platform payment request" })
    });
    const rejectPayload = await reject.json();

    assert.equal(reject.status, 200);
    assert.equal(rejectPayload.data.status, "rejected");
    assert.equal(rejectPayload.data.resolutionReason, "Off-platform payment request");

    const notifications = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: adminHeaders()
    });
    const notificationPayload = await notifications.json();

    assert.equal(notifications.status, 200);
    assert.equal(notificationPayload.data.at(-1).type, "listing_rejected");
    assert.match(notificationPayload.data.at(-1).message, /Off-platform payment request/);
  });
});

test("admins can rule on disputes and toggle platform controls", async () => {
  await withServer(async (baseUrl) => {
    const ruling = await fetch(`${baseUrl}/api/admin/disputes/dsp_landing_refund/ruling`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "Client evidence supports partial refund" })
    });
    const rulingPayload = await ruling.json();

    assert.equal(ruling.status, 200);
    assert.equal(rulingPayload.data.status, "resolved");
    assert.equal(rulingPayload.data.ruling.outcome, "refund");

    const controls = await fetch(`${baseUrl}/api/admin/controls/jobPostingEnabled`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    const controlsPayload = await controls.json();

    assert.equal(controls.status, 200);
    assert.equal(controlsPayload.data.jobPostingEnabled, false);
  });
});
