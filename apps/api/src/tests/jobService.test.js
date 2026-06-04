import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves server-owned id and open status", async () => {
  const job = await createJob({
    id: "client_supplied_id",
    title: "Build a dashboard",
    status: "closed"
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "client_supplied_id");
  assert.equal(job.status, "open");
});
