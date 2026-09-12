import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret";

function makeToken(role) {
  return jwt.sign({ userId: "admin1", role }, JWT_SECRET, { expiresIn: "1h" });
}

function request(app, method, path, token, body) {
  return new Promise((resolve) => {
    const req = {
      method,
      url: path,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: body ? JSON.stringify(body) : undefined,
    };
    const res = {
      status: (s) => { res._status = s; return res; },
      json: (d) => resolve({ status: res._status || 200, data: d }),
    };
    // Simulate express middleware
    import("../app.js").then(({ createApp }) => {
      const app = createApp();
      // Use supertest-style manual call
    });
  });
}

// Test the admin service directly
test("Admin service: getAdminMetrics returns summary cards", async () => {
  const { getAdminMetrics } = await import("../services/adminService.js");
  const metrics = await getAdminMetrics();
  assert.ok(metrics.totalUsers > 0);
  assert.ok(metrics.activeJobs >= 0);
  assert.ok(metrics.openDisputes >= 0);
  assert.ok(metrics.flaggedListings >= 0);
  assert.ok(typeof metrics.revenue === "number");
  assert.ok(metrics.trustScoreDistribution);
  assert.ok("76-100" in metrics.trustScoreDistribution);
});

test("Admin service: listUsers returns paginated results", async () => {
  const { listUsers } = await import("../services/adminService.js");
  const result = await listUsers({ page: 1, limit: 2 });
  assert.equal(result.items.length, 2);
  assert.ok(result.total >= 5);
  assert.equal(result.page, 1);
  assert.equal(result.limit, 2);
});

test("Admin service: listUsers filters by role", async () => {
  const { listUsers } = await import("../services/adminService.js");
  const result = await listUsers({ role: "freelancer" });
  assert.ok(result.items.every((u) => u.role === "freelancer"));
});

test("Admin service: listUsers filters by status", async () => {
  const { listUsers } = await import("../services/adminService.js");
  const result = await listUsers({ status: "banned" });
  assert.ok(result.items.every((u) => u.status === "banned"));
});

test("Admin service: getUserDetail returns user with disputes", async () => {
  const { getUserDetail } = await import("../services/adminService.js");
  const user = await getUserDetail("u1");
  assert.ok(user);
  assert.equal(user.id, "u1");
  assert.ok(Array.isArray(user.disputeHistory));
});

test("Admin service: getUserDetail returns null for unknown user", async () => {
  const { getUserDetail } = await import("../services/adminService.js");
  const user = await getUserDetail("nonexistent");
  assert.equal(user, null);
});

test("Admin service: suspendUser changes status and writes audit", async () => {
  const { suspendUser, listAuditLog } = await import("../services/adminService.js");
  const user = await suspendUser("u1", "admin1", "Test suspension");
  assert.equal(user.status, "suspended");
  const log = await listAuditLog({});
  assert.ok(log.items.some((a) => a.action === "suspend_user" && a.targetId === "u1"));
});

test("Admin service: suspendUser throws for already suspended", async () => {
  const { suspendUser } = await import("../services/adminService.js");
  await assert.rejects(() => suspendUser("u3", "admin1", "test"), /already suspended/);
});

test("Admin service: reinstateUser changes status back to active", async () => {
  const { reinstateUser } = await import("../services/adminService.js");
  const user = await reinstateUser("u3", "admin1");
  assert.equal(user.status, "active");
});

test("Admin service: banUser changes status to banned", async () => {
  const { banUser } = await import("../services/adminService.js");
  const user = await banUser("u4", "admin1", "Test ban");
  assert.equal(user.status, "banned");
});

test("Admin service: listFlaggedJobs returns flagged listings", async () => {
  const { listFlaggedJobs } = await import("../services/adminService.js");
  const result = await listFlaggedJobs({});
  assert.ok(result.items.length > 0);
  assert.ok(result.total > 0);
});

test("Admin service: approveJob changes status to approved", async () => {
  const { approveJob } = await import("../services/adminService.js");
  const job = await approveJob("j1", "admin1");
  assert.equal(job.status, "approved");
});

test("Admin service: rejectJob changes status and includes notification", async () => {
  const { rejectJob } = await import("../services/adminService.js");
  const job = await rejectJob("j2", "admin1", "Spam");
  assert.equal(job.status, "rejected");
  assert.ok(job.notification);
  assert.equal(job.notification.reason, "Spam");
});

test("Admin service: escalateJob changes status to escalated", async () => {
  const { escalateJob } = await import("../services/adminService.js");
  const job = await escalateJob("j3", "admin1");
  assert.equal(job.status, "escalated");
});

test("Admin service: listDisputes returns disputes", async () => {
  const { listDisputes } = await import("../services/adminService.js");
  const result = await listDisputes({});
  assert.ok(result.items.length > 0);
});

test("Admin service: listDisputes filters by status", async () => {
  const { listDisputes } = await import("../services/adminService.js");
  const result = await listDisputes({ status: "open" });
  assert.ok(result.items.every((d) => d.status === "open"));
});

test("Admin service: getDisputeDetail returns dispute with parties", async () => {
  const { getDisputeDetail } = await import("../services/adminService.js");
  const dispute = await getDisputeDetail("d1");
  assert.ok(dispute);
  assert.ok(dispute.freelancer);
  assert.ok(dispute.client);
});

test("Admin service: resolveDispute changes status and sends notifications", async () => {
  const { resolveDispute } = await import("../services/adminService.js");
  const result = await resolveDispute("d1", "admin1", "freelancer", true);
  assert.equal(result.status, "resolved");
  assert.ok(result.notifications);
  assert.equal(result.notifications.length, 2);
});

test("Admin service: resolveDispute throws for already resolved", async () => {
  const { resolveDispute } = await import("../services/adminService.js");
  await assert.rejects(() => resolveDispute("d1", "admin1", "freelancer", false), /already resolved/);
});

test("Admin service: getPlatformControls returns toggles", async () => {
  const { getPlatformControls } = await import("../services/adminService.js");
  const controls = await getPlatformControls();
  assert.ok("registrationsEnabled" in controls);
  assert.ok("jobPostingsEnabled" in controls);
});

test("Admin service: togglePlatformControl changes value and writes audit", async () => {
  const { togglePlatformControl, getPlatformControls, listAuditLog } = await import("../services/adminService.js");
  const controls = await togglePlatformControl("registrationsEnabled", false, "admin1");
  assert.equal(controls.registrationsEnabled, false);
  const current = await getPlatformControls();
  assert.equal(current.registrationsEnabled, false);
  const log = await listAuditLog({});
  assert.ok(log.items.some((a) => a.action === "toggle_control"));
  // Reset for other tests
  await togglePlatformControl("registrationsEnabled", true, "admin1");
});

test("Admin service: togglePlatformControl throws for invalid key", async () => {
  const { togglePlatformControl } = await import("../services/adminService.js");
  await assert.rejects(() => togglePlatformControl("invalidKey", true, "admin1"), /Invalid platform control/);
});

test("Admin service: listAuditLog returns entries", async () => {
  const { listAuditLog } = await import("../services/adminService.js");
  const result = await listAuditLog({});
  assert.ok(result.items.length > 0);
});

test("Admin service: listAuditLog filters by action", async () => {
  const { listAuditLog } = await import("../services/adminService.js");
  const result = await listAuditLog({ action: "ban_user" });
  assert.ok(result.items.every((a) => a.action === "ban_user"));
});
