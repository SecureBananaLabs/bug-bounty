import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob: server-generated id cannot be overridden by caller", async () => {
  const result = await createJob({
    title: "Test job",
    id: "malicious_job_id"
  });
  
  assert.ok(result.id.startsWith("job_"));
  assert.notEqual(result.id, "malicious_job_id");
});

test("createJob: status always starts as open and cannot be overridden", async () => {
  const result = await createJob({
    title: "Test job",
    status: "completed"
  });
  
  assert.equal(result.status, "open");
  assert.notEqual(result.status, "completed");
});

test("createJob: preserves non-id/status fields from payload", async () => {
  const result = await createJob({
    title: "Build API",
    description: "Need a REST API",
    budgetMin: 500,
    budgetMax: 1000
  });
  
  assert.equal(result.title, "Build API");
  assert.equal(result.description, "Need a REST API");
  assert.equal(result.budgetMin, 500);
  assert.equal(result.budgetMax, 1000);
  assert.equal(result.status, "open");
  assert.ok(result.id.startsWith("job_"));
});
