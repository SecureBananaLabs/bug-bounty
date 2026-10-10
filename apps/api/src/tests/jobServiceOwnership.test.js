import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

const validJob = {
  title: "Build onboarding flow",
  description: "Create a reliable onboarding flow for new clients.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

test("createJob keeps id and initial status server-owned", async () => {
  const job = await createJob({
    ...validJob,
    id: "job_attacker",
    status: "closed"
  });

  assert.match(job.id, /^job_/);
  assert.notEqual(job.id, "job_attacker");
  assert.equal(job.status, "open");
  assert.equal(job.title, validJob.title);
  assert.deepEqual(job.skills, validJob.skills);
});
