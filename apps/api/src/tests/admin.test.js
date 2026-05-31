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

function adminHeaders() {
  return {
    authorization: `Bearer ${signAccessToken({ sub: "usr_admin", role: "admin" })}`,
    "content-type": "application/json"
  };
}

test("admin routes reject non-admin tokens server-side", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Admin access required" });
  });
});

test("admin can update user status and audit the action", async () => {
  await withServer(async (baseUrl) => {
    const statusResponse = await fetch(`${baseUrl}/api/admin/users/usr_free_003/status`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "banned" })
    });
    const statusPayload = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusPayload.success, true);
    assert.equal(statusPayload.data.status, "banned");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit`, {
      headers: adminHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data[0].action, "user_status_updated");
    assert.equal(auditPayload.data[0].target, "usr_free_003");
  });
});

test("admin moderation and dispute decisions update operational queues", async () => {
  await withServer(async (baseUrl) => {
    const moderationResponse = await fetch(`${baseUrl}/api/admin/moderation/flag_1001`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ action: "reject", reason: "Escrow bypass language is not allowed." })
    });
    const moderationPayload = await moderationResponse.json();

    assert.equal(moderationResponse.status, 200);
    assert.equal(moderationPayload.data.status, "rejected");
    assert.match(moderationPayload.data.notification, /Posting user notified/);

    const disputeResponse = await fetch(`${baseUrl}/api/admin/disputes/dsp_7001/ruling`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ ruling: "freelancer", note: "Evidence supports completed scope." })
    });
    const disputePayload = await disputeResponse.json();

    assert.equal(disputeResponse.status, 200);
    assert.equal(disputePayload.data.status, "resolved");
    assert.deepEqual(disputePayload.data.notifications, ["client_notified", "freelancer_notified"]);
  });
});
