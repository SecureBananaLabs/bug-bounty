import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob ignores caller-supplied id", async () => {
  const job = await createJob({
    id: "job_attacker_controlled",
    title: "Test job",
    description: "Testing server-owned fields",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "security"
  });
  assert.ok(job.id.startsWith("job_"));
  assert.notEqual(job.id, "job_attacker_controlled");
});

test("createJob ignores caller-supplied status", async () => {
  const job = await createJob({
    status: "closed",
    title: "Test job",
    description: "Testing server-owned status",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "security"
  });
  assert.equal(job.status, "open");
  assert.notEqual(job.status, "closed");
});

test("createJob preserves valid fields from payload", async () => {
  const job = await createJob({
    id: "job_should_be_ignored",
    status: "closed",
    title: "Real title",
    description: "Real description that is long enough",
    budgetMin: 200,
    budgetMax: 800,
    categoryId: "web"
  });
  assert.equal(job.title, "Real title");
  assert.equal(job.description, "Real description that is long enough");
  assert.equal(job.budgetMin, 200);
  assert.equal(job.budgetMax, 800);
  assert.equal(job.categoryId, "web");
  assert.ok(job.id.startsWith("job_"));
  assert.equal(job.status, "open");
});
