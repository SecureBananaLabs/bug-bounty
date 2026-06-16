import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves generated id and open status", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const job = await createJob({
      id: "job_client_controlled",
      title: "Build landing page",
      description: "Create a production-ready landing page.",
      status: "closed"
    });

    assert.equal(job.id, "job_1710000000000");
    assert.equal(job.status, "open");
    assert.equal(job.title, "Build landing page");
    assert.equal(job.description, "Create a production-ready landing page.");
  } finally {
    Date.now = originalNow;
  }
});
