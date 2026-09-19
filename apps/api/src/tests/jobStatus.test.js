import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob uses the canonical OPEN status and ignores caller overrides", async () => {
  const job = await createJob({
    title: "Build API integration",
    description: "Implement the integration end to end.",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "cat_web",
    skills: ["node"],
    status: "DRAFT"
  });

  assert.equal(job.status, "OPEN");
});
