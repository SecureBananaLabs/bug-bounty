import test from "node:test";
import assert from "assert/strict";
import { createServer } from "http";
import { listJobs, createJob } from "../services/jobService.js";

// Reset jobs array before each test by re-importing is tricky with ESM,
// so we test behavioral contracts instead.

test("listJobs returns seeded sample data (fixes #1554)", async () => {
  const jobs = await listJobs();
  assert.ok(Array.isArray(jobs), "jobs should be an array");
  assert.ok(jobs.length >= 3, `should have at least 3 seed jobs, got ${jobs.length}`);
});

test("seeded jobs have required fields", async () => {
  const jobs = await listJobs();
  for (const job of jobs) {
    assert.ok(job.id, "job should have id");
    assert.ok(job.title, "job should have title");
    assert.ok(job.status, "job should have status");
    assert.ok(typeof job.budgetMin === "number", "budgetMin should be number");
    assert.ok(typeof job.budgetMax === "number", "budgetMax should be number");
  }
});

test("listJobs returns defensive copies (no mutation aliasing)", async () => {
  const jobs1 = await listJobs();
  const jobs2 = await listJobs();
  // Modifying a returned object should not affect subsequent calls
  if (jobs1.length > 0) {
    jobs1[0].title = "MUTATED_TITLE";
    const jobs3 = await listJobs();
    assert.notEqual(jobs3[0].title, "MUTATED_TITLE", "defensive copy should prevent mutation");
  }
});

test("createJob appends to the seeded list", async () => {
  const before = await listJobs();
  const newJob = await createJob({
    title: "Test Job",
    description: "Test",
    budgetMin: 100,
    budgetMax: 200,
    skills: ["test"],
    clientId: "test_client",
  });
  const after = await listJobs();

  assert.equal(newJob.title, "Test Job");
  assert.ok(newJob.id.startsWith("job_"), "generated id should start with job_");
  assert.equal(after.length, before.length + 1, "list should grow by 1 after create");

  // Find the new job in the list
  const found = after.find((j) => j.id === newJob.id);
  assert.ok(found, "created job should appear in listJobs result");
  assert.equal(found.title, "Test Job");
});

test("createJob returns a defensive copy", async () => {
  // Use a distinctive title so we can identify our job even if IDs collide
  const UNIQUE_TITLE = `DefensiveCopy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job = await createJob({
    title: UNIQUE_TITLE,
    budgetMin: 50,
    budgetMax: 100,
    skills: ["copy"],
    clientId: "copy_client",
  });
  // Mutating the returned value shouldn't affect internal state
  job.title = "MUTATED_VIA_RETURNED_COPY";
  const jobs = await listJobs();
  const found = jobs.find((j) => j.title === UNIQUE_TITLE);
  if (found) {
    assert.equal(found.title, UNIQUE_TITLE, "internal store should not be affected by mutating returned copy");
  } else {
    // Fallback: verify by checking that MUTATED_VIA_RETURNED_COPY doesn't appear
    const mutated = jobs.find((j) => j.title === "MUTATED_VIA_RETURNED_COPY");
    assert.ok(!mutated, "mutation of returned copy should not leak into stored data");
  }
});
