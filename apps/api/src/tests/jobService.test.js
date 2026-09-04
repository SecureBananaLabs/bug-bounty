import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves server-owned id and status", async () => {
  const job = await createJob({
    id: "client_job",
    status: "closed",
    title: "Build a dashboard",
    description: "Create a dashboard for project performance.",
    budgetMin: 500,
    budgetMax: 1000,
    categoryId: "analytics",
    skills: ["charts"]
  });

  assert.match(job.id, /^job_\d+$/);
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a dashboard");
});
