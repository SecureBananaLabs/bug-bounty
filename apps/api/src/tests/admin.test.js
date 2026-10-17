import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${signAccessToken({ sub: "admin_1", role: "admin" })}`,
    "Content-Type": "application/json"
  };
}

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin can read overview and paginated users", async () => {
  await withServer(async (baseUrl) => {
    const overviewResponse = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: adminHeaders()
    });
    const overview = await overviewResponse.json();

    assert.equal(overviewResponse.status, 200);
    assert.equal(overview.data.summary.totalUsers >= 1, true);
    assert.equal(Array.isArray(overview.data.trustDistribution), true);

    const usersResponse = await fetch(
      `${baseUrl}/api/admin/users?role=freelancer&page=1&pageSize=2`,
      { headers: adminHeaders() }
    );
    const users = await usersResponse.json();

    assert.equal(usersResponse.status, 200);
    assert.equal(users.data.page, 1);
    assert.equal(users.data.pageSize, 2);
    assert.equal(users.data.items.every((user) => user.role === "freelancer"), true);
  });
});

test("admin actions update resources and write audit entries", async () => {
  await withServer(async (baseUrl) => {
    const moderationResponse = await fetch(
      `${baseUrl}/api/admin/moderation/jobs/job_202/decision`,
      {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          decision: "rejected",
          reason: "External contact details in listing"
        })
      }
    );
    const moderation = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.equal(moderation.data.job.moderationStatus, "rejected");
    assert.match(moderation.data.audit.action, /job\.rejected/);

    const controlResponse = await fetch(`${baseUrl}/api/admin/controls`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({
        key: "jobPostingsEnabled",
        enabled: false
      })
    });
    const control = await controlResponse.json();

    assert.equal(controlResponse.status, 200);
    assert.equal(control.data.controls.jobPostingsEnabled, false);

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?pageSize=5`, {
      headers: adminHeaders()
    });
    const audit = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(audit.data.items.some((entry) => entry.action === "job.rejected"), true);
    assert.equal(
      audit.data.items.some((entry) => entry.action === "control.jobPostingsEnabled"),
      true
    );
  });
});
