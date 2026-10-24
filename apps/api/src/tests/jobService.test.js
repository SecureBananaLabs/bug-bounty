import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps server-owned id and open status", async () => {
  const originalNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const job = await createJob({
      id: "job_client_supplied",
      status: "closed",
      title: "Build a scoped automation"
    });

    assert.equal(job.id, "job_1720000000000");
    assert.equal(job.status, "open");
    assert.equal(job.title, "Build a scoped automation");
  } finally {
    Date.now = originalNow;
  }
});
