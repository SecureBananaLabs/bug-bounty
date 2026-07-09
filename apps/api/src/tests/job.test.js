import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("Job Service - Create Job field preservation", async (t) => {
  await t.test("createJob should ignore user-provided id and status", async () => {
    const payload = {
      title: "Senior Fullstack Engineer",
      description: "Looking for an expert developer.",
      budgetMin: 50,
      budgetMax: 100,
      categoryId: "cat_1",
      id: "hacky_id_123",
      status: "closed"
    };

    const job = await createJob(payload);

    assert.ok(job.id);
    assert.notEqual(job.id, "hacky_id_123");
    assert.ok(job.id.startsWith("job_"));
    assert.equal(job.status, "open");
  });
});
