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

function headers(role = "admin") {
  const token = signAccessToken({ sub: `test_${role}`, role });
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

test("admin routes reject non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: headers("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
  });
});

test("admin metrics include trust and moderation totals", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: headers()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.totalUsers, 4);
    assert.equal(payload.data.openDisputes, 2);
    assert.equal(payload.data.trustScoreDistribution.length, 3);
  });
});

test("admin users endpoint filters and paginates users", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&limit=1`, {
      headers: headers()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].role, "freelancer");
    assert.equal(payload.data.total, 2);
  });
});

test("admin actions update state and append audit entries", async () => {
  await withServer(async (baseUrl) => {
    const update = await fetch(`${baseUrl}/api/admin/users/usr_free_002/status`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "suspended" })
    });
    const updated = await update.json();

    assert.equal(update.status, 200);
    assert.equal(updated.data.status, "suspended");

    const audit = await fetch(`${baseUrl}/api/admin/audit-log?action=user_suspended`, {
      headers: headers()
    });
    const auditPayload = await audit.json();

    assert.equal(audit.status, 200);
    assert.equal(auditPayload.data.items[0].targetId, "usr_free_002");
  });
});

test("admin can moderate listings, rule disputes, and update controls", async () => {
  await withServer(async (baseUrl) => {
    const moderated = await fetch(`${baseUrl}/api/admin/moderation/jobs/flag_101/actions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ action: "reject", reason: "Violates platform policy" })
    });
    const moderatedPayload = await moderated.json();
    assert.equal(moderated.status, 200);
    assert.equal(moderatedPayload.data.listing.status, "rejected");
    assert.match(moderatedPayload.data.notification.message, /Violates platform policy/);

    const ruling = await fetch(`${baseUrl}/api/admin/disputes/disp_201/rulings`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ruling: "freelancer", reason: "Evidence shows delivery was approved" })
    });
    const rulingPayload = await ruling.json();
    assert.equal(ruling.status, 200);
    assert.equal(rulingPayload.data.dispute.status, "resolved");

    const control = await fetch(`${baseUrl}/api/admin/controls/jobPostingEnabled`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ enabled: false })
    });
    const controlPayload = await control.json();
    assert.equal(control.status, 200);
    assert.equal(controlPayload.data.jobPostingEnabled, false);
  });
});
