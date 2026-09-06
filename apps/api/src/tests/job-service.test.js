import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob ignores caller-controlled id and status", async () => {
  const originalNow = Date.now;
  Date.now = () => 4321;

  try {
    const job = await createJob({
      id: "caller_job",
      status: "closed",
      title: "Build landing page",
      budgetMin: 100,
      budgetMax: 200
    });

    assert.equal(job.id, "job_4321");
    assert.equal(job.status, "open");
    assert.equal(job.title, "Build landing page");
    assert.equal(job.budgetMin, 100);
  } finally {
    Date.now = originalNow;
  }
});
