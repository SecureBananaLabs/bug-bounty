import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createApp } from "../app.js";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeToken(role = "admin", secret = "development-secret") {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ id: "test_usr", role, iat: now, exp: now + 3600 }));
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${payload}.${sig}`;
}

test("Admin API - Role Guard and Endpoints", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const adminToken = makeToken("admin");
  const freelancerToken = makeToken("freelancer");

  await t.test("rejects unauthenticated requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
  });

  await t.test("rejects non-admin requests with 403 Forbidden", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${freelancerToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Admin privileges required/);
  });

  await t.test("allows admin to fetch metrics", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.totalUsers >= 6);
    assert.ok(body.data.trustScores.excellent > 0);
  });

  await t.test("allows admin to search and paginate users", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users?search=alex`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.data.length, 1);
    assert.equal(body.data.data[0].name, "Alex Rivers");
  });

  await t.test("allows admin to suspend and reinstate a user", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/usr_1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "suspended", reason: "Investigation pending" })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "suspended");

    // Reinstate
    const res2 = await fetch(`${baseUrl}/api/admin/users/usr_1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "active", reason: "Clear" })
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.status, "active");
  });

  await t.test("allows admin to moderate a job", async () => {
    const res = await fetch(`${baseUrl}/api/admin/moderation/jobs/job_flag_1/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: "approved", reason: "Verified compliance" })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.job.status, "approved");
  });

  await t.test("allows admin to resolve a dispute", async () => {
    const res = await fetch(`${baseUrl}/api/admin/disputes/disp_101/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ruling: "favor_freelancer", notes: "Milestone code passed spec" })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "resolved");
    assert.equal(body.data.ruling.decision, "favor_freelancer");
  });

  await t.test("allows admin to toggle platform controls with audit logging", async () => {
    const res = await fetch(`${baseUrl}/api/admin/controls/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ controlName: "allowRegistrations", enabled: false })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.allowRegistrations, false);

    // Verify written to audit log
    const logRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(logRes.status, 200);
    const logBody = await logRes.json();
    assert.ok(logBody.data.data.length > 0);
    const hasToggle = logBody.data.data.some(l => l.actionType === "PLATFORM_CONTROL_TOGGLE");
    assert.ok(hasToggle);
  });

  await new Promise((resolve) => server.close(resolve));
});
