import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

function validJobPayload(overrides = {}) {
  return {
    title: "API integration",
    description: "Connect the service to a partner API.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_backend",
    skills: ["node", "api"],
    ...overrides,
  };
}

test("createJob initializes jobs with the OPEN status", async () => {
  const job = await createJob(validJobPayload());

  assert.equal(job.status, "OPEN");
});

test("createJob does not allow payload status to override the initial state", async () => {
  const job = await createJob(validJobPayload({ status: "COMPLETED" }));

  assert.equal(job.status, "OPEN");
});
