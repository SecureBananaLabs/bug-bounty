import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob prevents id and status override via mass-assignment", async () => {
  const payload = {
    title: "Vulnerability Fixer",
    description: "Fixing mass-assignment vulnerabilities",
    id: "hacked_id_123",
    status: "COMPLETED"
  };

  const createdJob = await createJob(payload);

  // Check that the returned job has a server-generated ID and status "open"
  assert.ok(createdJob.id.startsWith("job_"));
  assert.notEqual(createdJob.id, "hacked_id_123");
  assert.equal(createdJob.status, "open");

  // Check that listing jobs returns the correct values too
  const jobs = await listJobs();
  const found = jobs.find(j => j.title === "Vulnerability Fixer");
  assert.ok(found);
  assert.notEqual(found.id, "hacked_id_123");
  assert.equal(found.status, "open");
});
