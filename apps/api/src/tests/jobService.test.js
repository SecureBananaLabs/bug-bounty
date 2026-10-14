import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob keeps server-owned id and status", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000002000;

  try {
    const job = await createJob({
      title: "Bug fix",
      budget: 1000,
      id: "client_supplied_id",
      status: "closed",
    });

    assert.equal(job.id, "job_1700000002000");
    assert.equal(job.status, "open");

    const [storedJob] = await listJobs();
    assert.equal(storedJob.id, "job_1700000002000");
    assert.equal(storedJob.status, "open");
  } finally {
    Date.now = originalNow;
  }
});
