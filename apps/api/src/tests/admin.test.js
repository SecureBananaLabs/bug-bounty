import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// ── Unit tests for admin service ──

import {
  getAdminMetrics, getTrustDistribution,
  getUsers, updateUserStatus, getUserById,
  getFlaggedJobs, moderateFlaggedJob,
  getDisputes, ruleDispute,
  toggleRegistrations, togglePostings,
  getAuditLog,
} from "../services/adminService.js";

describe("Admin Service", () => {
  describe("getAdminMetrics", () => {
    it("returns summary metrics", () => {
      const m = getAdminMetrics();
      assert.ok(typeof m.totalUsers === "number");
      assert.ok(typeof m.activeJobs === "number");
      assert.ok(typeof m.openDisputes === "number");
      assert.ok(typeof m.flaggedListings === "number");
      assert.ok(typeof m.revenue === "number");
      assert.strictEqual(typeof m.registrationsOpen, "boolean");
      assert.strictEqual(typeof m.postingsOpen, "boolean");
    });
  });

  describe("getTrustDistribution", () => {
    it("returns 5 brackets summing to total users", () => {
      const d = getTrustDistribution();
      const sum = Object.values(d).reduce((a, b) => a + b, 0);
      const { totalUsers } = getAdminMetrics();
      assert.strictEqual(sum, totalUsers);
    });
  });

  describe("getUsers", () => {
    it("returns paginated users", () => {
      const { items, total, page, totalPages } = getUsers({ page: 1, limit: 2 });
      assert.strictEqual(items.length, 2);
      assert.ok(total >= 5);
      assert.strictEqual(page, 1);
      assert.ok(totalPages >= 3);
    });

    it("filters by role", () => {
      const { items } = getUsers({ role: "admin" });
      assert.ok(items.every(u => u.role === "admin"));
    });

    it("filters by status", () => {
      const { items } = getUsers({ status: "banned" });
      assert.ok(items.every(u => u.status === "banned"));
    });

    it("searches by username or email", () => {
      const { items } = getUsers({ search: "alice" });
      assert.ok(items.length >= 1);
      assert.ok(items.some(u => u.username.includes("alice")));
    });
  });

  describe("updateUserStatus", () => {
    it("updates user status and logs audit", () => {
      const before = getAuditLog({ page: 1 });
      const result = updateUserStatus("u4", "u1", "suspended");
      assert.ok(result);
      assert.strictEqual(result.status, "suspended");
      const after = getAuditLog({ page: 1 });
      assert.ok(after.total > before.total, "audit log should have grown");
    });

    it("returns null for unknown user", () => {
      assert.strictEqual(updateUserStatus("u4", "nonexistent", "active"), null);
    });
  });

  describe("getUserById", () => {
    it("returns user with dispute history", () => {
      const user = getUserById("u1");
      assert.ok(user);
      assert.ok(Array.isArray(user.disputeHistory));
    });

    it("returns null for unknown user", () => {
      assert.strictEqual(getUserById("nonexistent"), null);
    });
  });

  describe("getFlaggedJobs", () => {
    it("returns paginated flagged jobs", () => {
      const { items, total } = getFlaggedJobs({ page: 1 });
      assert.ok(items.length >= 1);
      assert.ok(total >= 2);
    });
  });

  describe("moderateFlaggedJob", () => {
    it("approves a flagged job", () => {
      const result = moderateFlaggedJob("u4", "fj1", "approved", "Looks fine");
      assert.ok(result);
      assert.strictEqual(result.status, "approved");
    });

    it("returns null for unknown flag", () => {
      assert.strictEqual(moderateFlaggedJob("u4", "nonexistent", "approved"), null);
    });
  });

  describe("getDisputes", () => {
    it("returns paginated disputes", () => {
      const { items, total } = getDisputes({ page: 1 });
      assert.ok(items.length >= 1);
      assert.ok(total >= 2);
    });
  });

  describe("ruleDispute", () => {
    it("resolves a dispute with ruling", () => {
      const result = ruleDispute("u4", "d1", { inFavorOf: "freelancer", action: "release" });
      assert.ok(result);
      assert.strictEqual(result.status, "resolved");
      assert.strictEqual(result.ruling.inFavorOf, "freelancer");
    });

    it("returns null for unknown dispute", () => {
      assert.strictEqual(ruleDispute("u4", "nonexistent", {}), null);
    });
  });

  describe("toggleRegistrations", () => {
    it("toggles registrations and logs audit", () => {
      const r = toggleRegistrations("u4", false);
      assert.strictEqual(r.registrationsOpen, false);
      toggleRegistrations("u4", true); // reset
    });
  });

  describe("togglePostings", () => {
    it("toggles postings and logs audit", () => {
      const r = togglePostings("u4", false);
      assert.strictEqual(r.postingsOpen, false);
      togglePostings("u4", true); // reset
    });
  });

  describe("getAuditLog", () => {
    it("returns paginated audit entries", () => {
      const { items, total } = getAuditLog({ page: 1 });
      assert.ok(Array.isArray(items));
      assert.ok(total > 0, "should have at least one entry from previous tests");
    });

    it("filters by adminId", () => {
      const { items } = getAuditLog({ adminId: "u4" });
      assert.ok(items.every(e => e.adminId === "u4"));
    });
  });
});
