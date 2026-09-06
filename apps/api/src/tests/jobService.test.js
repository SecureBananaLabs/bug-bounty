import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob ignores client-controlled id and status values", async () => {
  const created = await createJob({
    id: "attacker",
    status: "closed",
    title: "Build a dashboard",
    description: "Build a small analytics dashboard with filters.",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "cat_1",
    skills: ["React"]
  });

  assert.notEqual(created.id, "attacker");
  assert.match(created.id, /^job_/);
  assert.equal(created.status, "open");
  assert.deepEqual(created.skills, ["React"]);
});

test("listJobs reflects stored jobs", async () => {
  const jobs = await listJobs();

  assert.ok(Array.isArray(jobs));
  assert.ok(jobs.length >= 1);
  assert.equal(jobs[jobs.length - 1].status, "open");
});
