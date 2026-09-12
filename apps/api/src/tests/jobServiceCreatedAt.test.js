import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob includes a server-owned createdAt timestamp", async () => {
  const job = await createJob({
    title: "Build landing page",
    clientId: "usr_client",
    budgetMin: 100,
    budgetMax: 500,
    createdAt: "1999-01-01T00:00:00.000Z"
  });
  const jobs = await listJobs();
  const storedJob = jobs.find((candidate) => candidate.id === job.id);

  assert.match(job.id, /^job_/);
  assert.equal(job.title, "Build landing page");
  assert.equal(job.clientId, "usr_client");
  assert.notEqual(job.createdAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(job.createdAt).toISOString());
  assert.equal(storedJob.createdAt, job.createdAt);
});
