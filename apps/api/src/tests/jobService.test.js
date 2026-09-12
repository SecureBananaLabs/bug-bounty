import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and initial status server-owned", async () => {
  const job = await createJob({
    id: "caller-controlled",
    status: "closed",
    title: "Build a checkout flow",
    description: "Implement a guided checkout flow for clients",
    budgetMin: 1000,
    budgetMax: 2500,
    categoryId: "web",
    skills: ["Next.js"]
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "caller-controlled");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a checkout flow");
  assert.deepEqual(job.skills, ["Next.js"]);
});
