import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("admin routes require an admin token", async () => {
  const { baseUrl, close } = await startServer();
  const userToken = signAccessToken({ sub: "usr_client", role: "client" });

  const unauthenticated = await fetch(`${baseUrl}/api/admin/metrics`);
  const forbidden = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${userToken}` }
  });

  assert.equal(unauthenticated.status, 401);
  assert.equal(forbidden.status, 403);

  await close();
});

test("admin can paginate users and write audit entries through actions", async () => {
  const { baseUrl, close } = await startServer();
  const token = signAccessToken({ sub: "adm_1", role: "admin" });
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };

  const usersResponse = await fetch(`${baseUrl}/api/admin/users?pageSize=2&role=client`, { headers });
  const usersPayload = await usersResponse.json();

  assert.equal(usersResponse.status, 200);
  assert.equal(usersPayload.data.pageSize, 2);
  assert.ok(usersPayload.data.items.every((user) => user.role === "client"));

  const actionResponse = await fetch(`${baseUrl}/api/admin/users/usr_client_01/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "suspended" })
  });
  const actionPayload = await actionResponse.json();

  assert.equal(actionResponse.status, 200);
  assert.equal(actionPayload.data.status, "suspended");

  const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?action=user.suspended`, { headers });
  const auditPayload = await auditResponse.json();

  assert.equal(auditResponse.status, 200);
  assert.ok(auditPayload.data.items.some((entry) => entry.targetId === "usr_client_01"));

  await close();
});

test("admin can moderate listings, rule disputes, and update controls", async () => {
  const { baseUrl, close } = await startServer();
  const token = signAccessToken({ sub: "adm_2", role: "admin" });
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };

  const moderation = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_flagged_01/decision`, {
    method: "POST",
    headers,
    body: JSON.stringify({ decision: "rejected", reason: "Off-platform payment request." })
  });
  const dispute = await fetch(`${baseUrl}/api/admin/disputes/dsp_1001/ruling`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ruling: "freelancer", reason: "Evidence confirms delivery." })
  });
  const control = await fetch(`${baseUrl}/api/admin/platform-controls/jobPosting`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ enabled: false })
  });

  assert.equal(moderation.status, 200);
  assert.equal((await moderation.json()).data.listing.status, "rejected");
  assert.equal(dispute.status, 200);
  assert.equal((await dispute.json()).data.dispute.status, "resolved");
  assert.equal(control.status, 200);
  assert.equal((await control.json()).data.enabled, false);

  await close();
});

async function startServer() {
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
