import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

function jobPayload(overrides = {}) {
  return {
    title: "Secure marketplace build",
    description: "Build a secure marketplace feature with regression coverage.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_status",
    skills: ["security"],
    ...overrides
  };
}

test("createJob assigns the server-owned OPEN status", async () => {
  const job = await createJob(jobPayload());

  assert.equal(job.status, "OPEN");
});

test("createJob ignores caller-provided status overrides", async () => {
  const job = await createJob(jobPayload({ status: "COMPLETED" }));

  assert.equal(job.status, "OPEN");
});
