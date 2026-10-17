import assert from "node:assert/strict";
import test from "node:test";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and status server-owned", async () => {
  const job = await createJob({
    id: "job_attacker",
    title: "Build dashboard",
    description: "Create a hiring dashboard",
    budgetMin: 100,
    budgetMax: 200,
    status: "closed"
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "job_attacker");
  assert.equal(job.status, "open");
});
