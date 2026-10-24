import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves server-generated id and status", async () => {
  const job = await createJob({
    id: "job_client_supplied",
    status: "closed",
    title: "Build escrow flow",
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "job_client_supplied");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build escrow flow");
});
