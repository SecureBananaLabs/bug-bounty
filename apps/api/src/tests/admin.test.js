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

  try {
    const { port } = server.address();
    await assertion(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client_1", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 403);
  });
});

test("admin routes expose metrics and audit protected by admin role", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin_1", role: "admin" });
    const headers = { authorization: `Bearer ${token}` };

    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, { headers });
    const metricsPayload = await metricsResponse.json();

    assert.equal(metricsResponse.status, 200);
    assert.equal(metricsPayload.data.totalUsers, 3);
    assert.equal(metricsPayload.data.openDisputes, 1);

    const updateResponse = await fetch(`${baseUrl}/api/admin/users/usr_freelancer_2/status`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ status: "banned" })
    });
    const updatePayload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updatePayload.data.status, "banned");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log`, { headers });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items[0].action, "user_banned");
  });
});
