import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps job metadata server-owned", async (t) => {
  const originalNow = Date.now;
  t.after(() => {
    Date.now = originalNow;
  });
  Date.now = () => 1700000000000;

  const job = await createJob({
    id: "job_client_supplied",
    status: "closed",
    title: "Build secure API",
    description: "Build a secure API for clients",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "cat_api",
    skills: ["node"]
  });

  assert.equal(job.id, "job_1700000000000");
  assert.equal(job.status, "open");
});
