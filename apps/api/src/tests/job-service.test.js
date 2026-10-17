import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

const baseJob = {
  title: "Build a status-safe workflow",
  description: "Create a job record with a server-owned initial status.",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "cat_engineering",
  skills: ["node"]
};

test("createJob uses Prisma OPEN status for new jobs", async () => {
  const job = await createJob(baseJob);

  assert.equal(job.status, "OPEN");
});

test("createJob does not let callers override initial status", async () => {
  const job = await createJob({
    ...baseJob,
    status: "COMPLETED"
  });

  assert.equal(job.status, "OPEN");
});
