import test from "node:test";
import assert from "node:assert/strict";
import { getAdminMetrics } from "../services/adminService.js";
import { createJob } from "../services/jobService.js";
import { createUser } from "../services/userService.js";

test("getAdminMetrics computes counts from real stores", async () => {
  const before = await getAdminMetrics();

  await createJob({
    title: "Compute metrics",
    description: "Jobs should be counted.",
    budgetMin: 10,
    budgetMax: 20,
    categoryId: "cat_dev"
  });
  await createUser({ email: "f@example.com", role: "freelancer" });

  const after = await getAdminMetrics();

  assert.equal(after.openJobs, before.openJobs + 1);
  assert.equal(after.activeFreelancers, before.activeFreelancers + 1);
  assert.equal(after.flaggedAccounts, 0);
  assert.equal(after.monthlyVolume, 0);
});
