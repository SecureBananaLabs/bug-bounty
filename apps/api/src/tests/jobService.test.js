import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps server-owned id and status authoritative", async () => {
  const job = await createJob({
    id: "client-controlled-id",
    status: "closed",
    title: "Build a dashboard",
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "client-controlled-id");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a dashboard");
});
