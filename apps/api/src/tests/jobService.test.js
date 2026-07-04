import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves generated id and open status over payload values", async () => {
  const job = await createJob({
    id: "client_supplied_id",
    status: "closed",
    title: "Build dashboard",
    description: "Create a freelancer analytics dashboard",
    budgetMin: 500,
    budgetMax: 1000,
    categoryId: "analytics"
  });

  assert.match(job.id, /^job_\d+$/);
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build dashboard");
});
