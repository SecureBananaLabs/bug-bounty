import test from "node:test";
import assert from "node:assert/strict";

import { createJob } from "../services/jobService.js";

test("createJob keeps generated id and open status server-owned", async () => {
  const job = await createJob({
    title: "Server-owned fields",
    description: "Verify callers cannot replace protected job fields.",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "cat_1",
    skills: [],
    id: "attacker-controlled-id",
    status: "closed"
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "attacker-controlled-id");
  assert.equal(job.status, "open");
});
