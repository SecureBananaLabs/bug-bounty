import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(handler) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders(role = "admin") {
  const token = signAccessToken({ sub: role === "admin" ? "adm_001" : "usr_999", role });
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

test("admin routes require an authenticated admin role", async () => {
  await withServer(async (baseUrl) => {
    const unauthorized = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(unauthorized.status, 401);

    const forbidden = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders("client")
    });
    assert.equal(forbidden.status, 403);
  });
});

test("admin metrics expose platform health and trust distribution", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 5);
    assert.equal(payload.data.flaggedListings, 2);
    assert.deepEqual(
      payload.data.trustScoreDistribution.map((bucket) => bucket.range),
      ["0-39", "40-69", "70-89", "90-100"]
    );
  });
});

test("admin can filter users and write status changes to the audit log", async () => {
  await withServer(async (baseUrl) => {
    const usersResponse = await fetch(`${baseUrl}/api/admin/users?role=freelancer&status=active&pageSize=2`, {
      headers: authHeaders()
    });
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.total, 1);
    assert.equal(usersPayload.data.items[0].id, "usr_101");

    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_101/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Manual risk review" })
    });
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.data.user.status, "suspended");
    assert.equal(statusPayload.data.audit.action, "user.status_changed");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=user.status_changed`, {
      headers: authHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_101");
  });
});

test("admin moderation and dispute actions validate decisions and notify parties", async () => {
  await withServer(async (baseUrl) => {
    const rejectResponse = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_402`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ decision: "reject", reason: "Private contact data is not allowed" })
    });
    const rejectPayload = await rejectResponse.json();

    assert.equal(rejectResponse.status, 200);
    assert.equal(rejectPayload.data.job.status, "rejected");
    assert.equal(rejectPayload.data.audit.action, "listing.reject");

    const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_901/ruling`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "Escrow refund approved after evidence review" })
    });
    const disputePayload = await disputeResponse.json();

    assert.equal(disputeResponse.status, 200);
    assert.equal(disputePayload.data.dispute.status, "resolved");
    assert.equal(disputePayload.data.dispute.ruling, "refund");
  });
});
