import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves server-owned id and status", async () => {
  const job = await createJob({
    id: "client_supplied_id",
    status: "closed",
    title: "Frontend cleanup",
    description: "Tighten spacing and copy on the dashboard.",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "design",
    skills: ["css"]
  });

  assert.match(job.id, /^job_/);
  assert.equal(job.status, "open");
  assert.equal(job.title, "Frontend cleanup");
  assert.equal(job.budgetMin, 100);
  assert.equal(job.budgetMax, 250);
});
