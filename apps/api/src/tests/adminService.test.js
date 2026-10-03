import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { getAdminMetrics } from "../services/adminService.js";
import { createUser } from "../services/userService.js";

test("admin metrics reflect in-memory jobs and freelancer users", async () => {
  assert.deepEqual(await getAdminMetrics(), {
    openJobs: 0,
    activeFreelancers: 0,
    flaggedAccounts: 0,
    monthlyVolume: 0
  });

  await createJob({
    title: "Build a landing page",
    description: "Create a responsive marketplace landing page",
    budgetMin: 500,
    budgetMax: 1200,
    categoryId: "web",
    skills: ["nextjs"]
  });
  await createUser({
    email: "freelancer@example.com",
    role: "freelancer"
  });
  await createUser({
    email: "client@example.com",
    role: "client"
  });

  assert.deepEqual(await getAdminMetrics(), {
    openJobs: 1,
    activeFreelancers: 1,
    flaggedAccounts: 0,
    monthlyVolume: 0
  });
});
