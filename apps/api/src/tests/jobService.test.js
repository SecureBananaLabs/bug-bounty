import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob assigns distinct IDs when jobs are created in the same millisecond", async (t) => {
  const originalNow = Date.now;
  t.after(() => {
    Date.now = originalNow;
  });
  Date.now = () => 1_779_893_200_000;

  const first = await createJob({
    title: "First job",
    budgetMin: 100,
    budgetMax: 200
  });
  const second = await createJob({
    title: "Second job",
    budgetMin: 100,
    budgetMax: 200
  });

  assert.match(first.id, /^job_[0-9a-f-]{36}$/);
  assert.match(second.id, /^job_[0-9a-f-]{36}$/);
  assert.notEqual(first.id, second.id);
});
