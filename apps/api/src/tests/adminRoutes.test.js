import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("admin routes reject non-admin users server-side", async () => {
  const { baseUrl, close } = await startApp();
  const token = signAccessToken({ sub: "usr_existing", role: "client" });

  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.message, "Admin access required");

  await close();
});

test("admin can paginate users and write audited moderation actions", async () => {
  const { baseUrl, close } = await startApp();
  const token = signAccessToken({ sub: "admin_1", role: "admin" });
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };

  const usersResponse = await fetch(`${baseUrl}/api/admin/users?page=1&pageSize=2&role=client`, { headers });
  const usersPayload = await usersResponse.json();

  assert.equal(usersResponse.status, 200);
  assert.equal(usersPayload.data.items.length, 2);
  assert.equal(usersPayload.data.pageSize, 2);
  assert.ok(usersPayload.data.total >= 2);

  const actionResponse = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_102`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ action: "rejected", reason: "Payment terms missing" })
  });
  const actionPayload = await actionResponse.json();

  assert.equal(actionResponse.status, 200);
  assert.equal(actionPayload.data.status, "rejected");
  assert.equal(actionPayload.data.notificationQueued, true);

  const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=listing_moderated`, { headers });
  const auditPayload = await auditResponse.json();

  assert.equal(auditResponse.status, 200);
  assert.equal(auditPayload.data.items[0].adminId, "admin_1");
  assert.equal(auditPayload.data.items[0].target, "job_102");

  await close();
});

async function startApp() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}
