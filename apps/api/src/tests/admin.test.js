import { describe, it } from "node:test";
import assert from "node:assert/strict";

const {
  getAdminMetrics, getUsers, suspendUser, banUser,
  getFlaggedJobs, approveJob,
  getDisputes, resolveDispute,
  getPlatformSettings, toggleRegistrations, toggleJobPosting,
  getAuditLogs
} = await import("../services/adminService.js");

describe("Admin Service", () => {
  describe("Metrics", () => {
    it("returns platform metrics", async function() {
      var m = await getAdminMetrics();
      assert.ok(typeof m.totalUsers === "number");
      assert.ok(typeof m.activeJobs === "number");
    });
  });

  describe("User Management", () => {
    it("returns users list", async function() {
      var result = await getUsers({});
      assert.ok(Array.isArray(result.users));
    });
    it("throws 404 for nonexistent", async function() {
      await assert.rejects(function() { return suspendUser("nope", "admin-1"); }, { message: /not found/i });
    });
  });

  describe("Job Moderation", () => {
    it("returns flagged jobs", async function() {
      var result = await getFlaggedJobs({});
      assert.ok(Array.isArray(result.jobs));
    });
  });

  describe("Disputes", () => {
    it("returns dispute list", async function() {
      var result = await getDisputes({});
      assert.ok(Array.isArray(result.disputes));
    });
  });

  describe("Platform Controls", () => {
    it("gets settings", async function() {
      var s = await getPlatformSettings();
      assert.ok("registrationsOpen" in s);
    });
    it("toggles registrations and logs", async function() {
      var before = await getPlatformSettings();
      await toggleRegistrations(!before.registrationsOpen, "admin-test");
      var logs = await getAuditLogs({ adminId: "admin-test" });
      assert.ok(logs.logs.length > 0);
    });
  });
});
