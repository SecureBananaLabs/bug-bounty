import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and initial status server-owned", async () => {
  const job = await createJob({
    id: "job_client",
    status: "closed",
    title: "Build landing page",
    budgetMin: 100,
    budgetMax: 200
  });

  assert.match(job.id, /^job_/);
  assert.notEqual(job.id, "job_client");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build landing page");
});
