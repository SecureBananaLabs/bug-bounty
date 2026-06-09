import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

const baseJob = {
  title: "Build onboarding flow",
  description: "Create the client onboarding flow",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "cat_product",
  skills: ["Next.js"]
};

test("createJob defaults new jobs to the Prisma OPEN status", async () => {
  const job = await createJob(baseJob);

  assert.equal(job.status, "OPEN");
});

test("createJob keeps initial status server-owned", async () => {
  const job = await createJob({
    ...baseJob,
    title: "Build milestone tracker",
    status: "COMPLETED"
  });

  assert.equal(job.status, "OPEN");
});
