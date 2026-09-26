import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and initial status server-owned", async () => {
  const job = await createJob({
    id: "client-job-id",
    status: "closed",
    title: "Build a dashboard",
    description: "Create a useful dashboard for the client",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "analytics",
    skills: ["node"]
  });

  assert.notEqual(job.id, "client-job-id");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a dashboard");
  assert.equal(job.budgetMax, 200);
});
