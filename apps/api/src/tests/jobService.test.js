import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob protects generated id and default status from payload overrides", async () => {
  const job = await createJob({
    id: "evil",
    status: "closed",
    title: "Build escrow flow",
    description: "Implement the first escrow flow milestone.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "engineering",
    skills: ["node"]
  });

  assert.match(job.id, /^job_\d+$/);
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build escrow flow");
});
