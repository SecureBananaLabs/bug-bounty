import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob generates unique ids for same-millisecond creates", async () => {
  const originalNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const first = await createJob({ title: "First job" });
    const second = await createJob({ title: "Second job" });

    assert.match(first.id, /^job_/);
    assert.match(second.id, /^job_/);
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalNow;
  }
});
