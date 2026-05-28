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

function token(role, sub = `usr_${role}`) {
  return signAccessToken({ sub, role });
}

async function apiFetch(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const body = await response.json();
  return { response, body };
}

test("admin routes require a signed-in admin", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await apiFetch(baseUrl, "/api/admin/overview");
    assert.equal(anonymous.response.status, 401);

    const client = await apiFetch(baseUrl, "/api/admin/overview", {
      headers: { authorization: `Bearer ${token("client")}` }
    });
    assert.equal(client.response.status, 403);

    const admin = await apiFetch(baseUrl, "/api/admin/overview", {
      headers: { authorization: `Bearer ${token("admin", "usr_admin_1")}` }
    });
    assert.equal(admin.response.status, 200);
    assert.equal(admin.body.success, true);
    assert.equal(admin.body.data.metrics.totalUsers >= 1, true);
  });
});

test("admin users endpoint filters and paginates server-side", async () => {
  await withServer(async (baseUrl) => {
    const result = await apiFetch(baseUrl, "/api/admin/users?role=freelancer&pageSize=1", {
      headers: { authorization: `Bearer ${token("admin")}` }
    });

    assert.equal(result.response.status, 200);
    assert.equal(result.body.data.pagination.pageSize, 1);
    assert.equal(result.body.data.items.length, 1);
    assert.equal(result.body.data.items[0].role, "freelancer");
    assert.equal(result.body.data.pagination.total >= 2, true);
  });
});

test("admin actions update state and append audit records", async () => {
  await withServer(async (baseUrl) => {
    const adminAuth = { authorization: `Bearer ${token("admin", "usr_admin_1")}` };
    const update = await apiFetch(baseUrl, "/api/admin/users/usr_freelancer_1/status", {
      method: "PATCH",
      headers: adminAuth,
      body: JSON.stringify({ status: "suspended" })
    });

    assert.equal(update.response.status, 200);
    assert.equal(update.body.data.user.status, "suspended");
    assert.equal(update.body.data.audit.actionType, "user.suspended");

    const audit = await apiFetch(baseUrl, "/api/admin/audit-log?actionType=user.suspended", {
      headers: adminAuth
    });

    assert.equal(audit.response.status, 200);
    assert.equal(audit.body.data.items[0].targetId, "usr_freelancer_1");
  });
});
