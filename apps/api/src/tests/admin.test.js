import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders(role = "admin") {
  return {
    authorization: `Bearer ${signAccessToken({ sub: `usr_${role}`, role })}`,
    "content-type": "application/json",
  };
}

test("admin routes reject missing and non-admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/admin/users`);
    assert.equal(missing.status, 401);

    const nonAdmin = await fetch(`${baseUrl}/api/admin/users`, {
      headers: adminHeaders("client"),
    });
    const payload = await nonAdmin.json();
    assert.equal(nonAdmin.status, 403);
    assert.equal(payload.message, "Admin access required");
  });
});

test("admin users endpoint returns paginated filterable rows", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&status=active&page=1&pageSize=2`, {
      headers: adminHeaders(),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.page, 1);
    assert.equal(payload.data.pageSize, 2);
    assert.ok(payload.data.total >= 1);
    assert.ok(payload.data.items.every((user) => user.role === "freelancer"));
    assert.ok(payload.data.items.every((user) => user.status === "active"));
  });
});

test("admin moderation and platform actions append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const decision = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_flagged_1/decision`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ decision: "reject", reason: "Misleading budget range" }),
    });
    assert.equal(decision.status, 200);

    const toggle = await fetch(`${baseUrl}/api/admin/platform-controls`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ key: "jobPosting", enabled: false, reason: "Incident review" }),
    });
    assert.equal(toggle.status, 200);

    const audit = await fetch(`${baseUrl}/api/admin/audit?actionType=platform_toggle`, {
      headers: adminHeaders(),
    });
    const payload = await audit.json();
    assert.equal(audit.status, 200);
    assert.ok(payload.data.items.some((entry) => entry.actionType === "platform_toggle"));
  });
});
