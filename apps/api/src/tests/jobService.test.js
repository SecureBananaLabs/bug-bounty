import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

const baseJob = {
  title: "Build a reporting dashboard",
  description: "Create a weekly reporting dashboard for client metrics.",
  budgetMin: 1000,
  budgetMax: 2500,
  categoryId: "engineering",
  skills: ["Node.js", "PostgreSQL"]
};

test("createJob uses the server-owned OPEN status", async () => {
  const job = await createJob(baseJob);

  assert.equal(job.status, "OPEN");
});

test("createJob ignores caller-supplied status values", async () => {
  const job = await createJob({
    ...baseJob,
    status: "COMPLETED"
  });

  assert.equal(job.status, "OPEN");
});
