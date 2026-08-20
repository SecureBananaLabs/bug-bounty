import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

test("admin overview requires an admin role", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "user-2", role: "client" });

    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Admin access required"
    });
  });
});

test("admin overview returns moderation, dispute, control, and audit data", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "admin-1", role: "admin" });

    const response = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.metrics.totalUsers, 287);
    assert.ok(payload.data.users.some((user) => user.status === "suspended"));
    assert.ok(payload.data.flaggedListings.length > 0);
    assert.ok(payload.data.disputes.some((dispute) => dispute.status === "under_review"));
    assert.equal(payload.data.platformControls.registrationsEnabled, true);
    assert.ok(payload.data.auditLog.some((entry) => entry.action === "listing.rejected"));
  });
});

test("admin control updates are recorded in the audit log", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "admin-1", role: "admin" });

    const response = await fetch(`${baseUrl}/api/admin/platform-controls`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ registrationsEnabled: false, reason: "Fraud review window" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.platformControls.registrationsEnabled, false);
    assert.equal(payload.data.auditLog[0].adminId, "admin-1");
    assert.equal(payload.data.auditLog[0].action, "platform.registrations_paused");
  });
});
