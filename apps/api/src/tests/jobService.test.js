import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob preserves generated fields and normal payload attributes", async () => {
  const beforeCount = (await listJobs()).length;
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const job = await createJob({
      id: "job_client_controlled",
      title: "Build landing page",
      description: "Create a production-ready landing page.",
      status: "closed",
      budgetMin: 1200,
      budgetMax: 2500,
      categoryId: "cat_design",
      skills: ["nextjs", "css"]
    });

    assert.equal(job.id, "job_1710000000000");
    assert.equal(job.status, "open");
    assert.equal(job.title, "Build landing page");
    assert.equal(job.description, "Create a production-ready landing page.");
    assert.equal(job.budgetMin, 1200);
    assert.equal(job.budgetMax, 2500);
    assert.equal(job.categoryId, "cat_design");
    assert.deepEqual(job.skills, ["nextjs", "css"]);

    const jobs = await listJobs();
    assert.equal(jobs.length, beforeCount + 1);
    assert.equal(jobs[jobs.length - 1], job);
  } finally {
    Date.now = originalNow;
  }
});
