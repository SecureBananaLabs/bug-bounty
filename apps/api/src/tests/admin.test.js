import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function token(role) {
  return signAccessToken({ sub: `test_${role}`, role });
}

function headers(role) {
  return {
    authorization: `Bearer ${token(role)}`,
    "content-type": "application/json"
  };
}

test("admin API rejects non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      headers: headers("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin API lists users with pagination and metrics", async () => {
  await withServer(async (baseUrl) => {
    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: headers("admin")
    });
    const metricsPayload = await metricsResponse.json();

    assert.equal(metricsResponse.status, 200);
    assert.equal(metricsPayload.data.totalUsers, 4);
    assert.ok(Array.isArray(metricsPayload.data.trustDistribution));

    const usersResponse = await fetch(`${baseUrl}/api/admin/users?page=1&pageSize=2&role=client`, {
      headers: headers("admin")
    });
    const usersPayload = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(usersPayload.data.pageSize, 2);
    assert.equal(usersPayload.data.items.length, 2);
    assert.equal(usersPayload.data.items[0].role, "client");
  });
});

test("admin actions update state and append audit records", async () => {
  await withServer(async (baseUrl) => {
    const updateResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_1`, {
      method: "PATCH",
      headers: headers("admin"),
      body: JSON.stringify({ status: "suspended", reason: "manual review" })
    });
    const updatePayload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updatePayload.data.status, "suspended");

    const moderationResponse = await fetch(`${baseUrl}/api/admin/moderation/jobs/flag_2001/decision`, {
      method: "POST",
      headers: headers("admin"),
      body: JSON.stringify({ decision: "reject", reason: "external payment request" })
    });
    const moderationPayload = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.equal(moderationPayload.data.listing.status, "rejected");
    assert.equal(moderationPayload.data.notification.userId, "usr_client_2");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log`, {
      headers: headers("admin")
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.ok(auditPayload.data.items.some((entry) => entry.actionType === "user.suspended"));
    assert.ok(auditPayload.data.items.some((entry) => entry.actionType === "listing.rejected"));
  });
});
