import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("Job creation server-controlled status", async (t) => {
  await t.test("defaults to status OPEN", async () => {
    const job = await createJob({
      title: "React Developer",
      description: "Build premium components",
      budgetMin: 500,
      budgetMax: 1000,
      categoryId: "cat_1"
    });
    assert.equal(job.status, "OPEN");
  });

  await t.test("ignores client-supplied status", async () => {
    const job = await createJob({
      title: "React Developer",
      description: "Build premium components",
      budgetMin: 500,
      budgetMax: 1000,
      categoryId: "cat_1",
      status: "COMPLETED"
    });
    assert.equal(job.status, "OPEN");
  });
});
