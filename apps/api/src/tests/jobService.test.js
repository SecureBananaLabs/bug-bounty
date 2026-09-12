import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and initial status server-owned", async () => {
  const job = await createJob({
    id: "job_attacker",
    status: "closed",
    title: "Build a dashboard",
    description: "Create an analytics dashboard for invoices",
    budgetMin: 500,
    budgetMax: 1500,
    categoryId: "cat_design",
    skills: ["analytics", "ui"]
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "job_attacker");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a dashboard");
  assert.deepEqual(job.skills, ["analytics", "ui"]);
});
