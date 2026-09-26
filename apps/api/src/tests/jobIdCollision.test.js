import assert from "node:assert/strict";
import test from "node:test";

import { createJob } from "../services/jobService.js";

test("createJob generates distinct ids even within the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1787930000000;

  try {
    const first = await createJob({ title: "First job" });
    const second = await createJob({ title: "Second job" });

    assert.match(first.id, /^job_[0-9a-f-]{36}$/);
    assert.match(second.id, /^job_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalNow;
  }
});
