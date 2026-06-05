import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves server-owned id and initial status", async () => {
  const job = await createJob({
    id: "client_supplied_job_id",
    status: "completed",
    title: "Build a marketplace dashboard",
    description: "Create the analytics dashboard for client hiring.",
    budgetMin: 500,
    budgetMax: 1500,
    categoryId: "cat_engineering",
    skills: ["react", "node"],
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "client_supplied_job_id");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a marketplace dashboard");
  assert.equal(job.description, "Create the analytics dashboard for client hiring.");
  assert.equal(job.budgetMin, 500);
  assert.equal(job.budgetMax, 1500);
  assert.equal(job.categoryId, "cat_engineering");
  assert.deepEqual(job.skills, ["react", "node"]);
});
