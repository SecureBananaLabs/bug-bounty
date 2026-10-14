import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

function validJobPayload(overrides = {}) {
  return {
    title: "Build secure API",
    description: "Build a marketplace API with clear regression coverage.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_backend",
    skills: ["node"],
    ...overrides
  };
}

test("createJob ignores caller-controlled reserved and arbitrary fields", async () => {
  const job = await createJob(validJobPayload({
    id: "job_attacker",
    status: "COMPLETED",
    adminApproved: true,
    featured: true,
    internalNotes: "trusted"
  }));

  assert.notEqual(job.id, "job_attacker");
  assert.equal(job.status, "open");
  assert.equal(Object.hasOwn(job, "adminApproved"), false);
  assert.equal(Object.hasOwn(job, "featured"), false);
  assert.equal(Object.hasOwn(job, "internalNotes"), false);
});

test("createJob preserves expected job fields", async () => {
  const payload = validJobPayload({ skills: ["node", "security"] });
  const job = await createJob(payload);

  assert.equal(job.title, payload.title);
  assert.equal(job.description, payload.description);
  assert.equal(job.budgetMin, payload.budgetMin);
  assert.equal(job.budgetMax, payload.budgetMax);
  assert.equal(job.categoryId, payload.categoryId);
  assert.deepEqual(job.skills, payload.skills);
});
