import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob ignores caller-supplied id and status", async () => {
  const result = await createJob({
    title: "Test Job",
    description: "Test desc",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_1",
    id: "hacked-id",
    status: "completed"
  });
  assert.notEqual(result.id, "hacked-id", "caller-supplied id must be ignored");
  assert.equal(result.status, "open", "status must always be server-assigned open");
  assert.ok(result.id.startsWith("job_"), "id should be server-generated");
});
