import test from "node:test";
import assert from "node:assert/strict";
import { getAdminMetrics } from "../services/adminService.js";
import { createJob } from "../services/jobService.js";
import { createUser } from "../services/userService.js";

test("getAdminMetrics starts from conservative zero values", async () => {
  assert.deepEqual(await getAdminMetrics(), {
    openJobs: 0,
    activeFreelancers: 0,
    flaggedAccounts: 0,
    monthlyVolume: 0
  });
});

test("getAdminMetrics reflects open jobs and freelancer users", async () => {
  const before = await getAdminMetrics();

  await createJob({
    title: "Build onboarding flow",
    description: "Create a polished onboarding workflow",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_design"
  });
  await createJob({
    title: "Closed maintenance task",
    description: "Already completed maintenance work",
    budgetMin: 50,
    budgetMax: 100,
    categoryId: "cat_ops",
    status: "closed"
  });
  await createUser({ email: "freelancer@example.com", role: "freelancer" });
  await createUser({ email: "client@example.com", role: "client" });

  const metrics = await getAdminMetrics();

  assert.equal(metrics.openJobs, before.openJobs + 1);
  assert.equal(metrics.activeFreelancers, before.activeFreelancers + 1);
  assert.equal(metrics.flaggedAccounts, 0);
  assert.equal(metrics.monthlyVolume, 0);
});
