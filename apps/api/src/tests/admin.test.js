import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

const secret = "development-secret";

function token(role) {
  return jwt.sign({ sub: `test-${role}`, role }, secret, { expiresIn: "15m" });
}

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

function adminHeaders() {
  return {
    authorization: `Bearer ${token("admin")}`,
    "content-type": "application/json"
  };
}

test("admin API rejects missing and non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(missing.status, 401);

    const client = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token("client")}` }
    });
    assert.equal(client.status, 403);
  });
});

test("admin API exposes paginated users and metrics to admins", async () => {
  await withServer(async (baseUrl) => {
    const metrics = await fetch(`${baseUrl}/api/admin/metrics`, { headers: adminHeaders() });
    assert.equal(metrics.status, 200);
    const metricsBody = (await metrics.json()).data;
    assert.equal(metricsBody.totalUsers >= 4, true);
    assert.equal(Array.isArray(metricsBody.trustScoreDistribution), true);

    const users = await fetch(`${baseUrl}/api/admin/users?role=freelancer&pageSize=1`, { headers: adminHeaders() });
    assert.equal(users.status, 200);
    const usersBody = (await users.json()).data;
    assert.equal(usersBody.pageSize, 1);
    assert.equal(usersBody.items[0].role, "freelancer");
  });
});

test("admin actions update state and append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const status = await fetch(`${baseUrl}/api/admin/users/usr_client_1/status`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "suspended", reason: "Chargeback investigation" })
    });
    assert.equal(status.status, 200);
    assert.equal((await status.json()).data.status, "suspended");

    const control = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ enabled: false })
    });
    assert.equal(control.status, 200);
    assert.equal((await control.json()).data.enabled, false);

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?actionType=user.suspended`, {
      headers: adminHeaders()
    });
    assert.equal(audit.status, 200);
    const auditBody = (await audit.json()).data;
    assert.equal(auditBody.items.some((entry) => entry.targetId === "usr_client_1"), true);
  });
});

test("moderation and dispute rulings mutate queues", async () => {
  await withServer(async (baseUrl) => {
    const moderation = await fetch(`${baseUrl}/api/admin/moderation/jobs/flag_1/action`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Requests off-platform payment" })
    });
    assert.equal(moderation.status, 200);
    assert.equal((await moderation.json()).data.job.status, "rejected");

    const ruling = await fetch(`${baseUrl}/api/admin/disputes/dsp_1/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "refund", reason: "Client evidence confirms missed milestone" })
    });
    assert.equal(ruling.status, 200);
    const rulingBody = (await ruling.json()).data;
    assert.equal(rulingBody.status, "resolved");
    assert.equal(rulingBody.ruling.outcome, "refund");
  });
});
