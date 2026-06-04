import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and initial status server-owned", async () => {
  const job = await createJob({
    id: "job_client_controlled",
    status: "closed",
    title: "Build a small landing page",
    description: "Create and publish a focused marketing landing page.",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "web",
    skills: ["nextjs", "css"]
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "job_client_controlled");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a small landing page");
  assert.deepEqual(job.skills, ["nextjs", "css"]);
});
