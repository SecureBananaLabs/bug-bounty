import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob returns a defensive snapshot", async () => {
  const created = await createJob({
    title: "Returned job",
    description: "A job used to verify returned snapshots",
    budgetMin: 200,
    budgetMax: 500,
    categoryId: "qa",
    skills: ["Testing"]
  });

  created.title = "Mutated job";
  created.status = "closed";

  const jobs = await listJobs();

  assert.equal(jobs.some((job) => job.title === "Mutated job"), false);
  assert.equal(jobs.some((job) => job.status === "closed"), false);
  assert.equal(jobs.some((job) => job.title === "Returned job"), true);
});
