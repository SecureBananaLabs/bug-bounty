import assert from "node:assert/strict";
import test from "node:test";

import { createJob } from "../services/jobService.js";

test("createJob ignores caller-supplied id and status", async () => {
  const job = await createJob({
    id: "job_attacker",
    status: "closed",
    title: "Migrate auth service",
    description: "Keep the scope tight and production-ready.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "backend",
    skills: ["node", "testing"]
  });

  assert.notEqual(job.id, "job_attacker");
  assert.match(job.id, /^job_\d+$/);
  assert.equal(job.status, "open");
  assert.equal(job.title, "Migrate auth service");
  assert.equal(job.budgetMin, 100);
  assert.equal(job.budgetMax, 500);
});
