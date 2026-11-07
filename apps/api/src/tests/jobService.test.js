import assert from "node:assert/strict";
import test from "node:test";

import { createJob } from "../services/jobService.js";

test("createJob keeps IDs server-owned and collision-resistant", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const first = await createJob({ id: "caller-controlled", title: "First" });
    const second = await createJob({ title: "Second", status: "draft" });

    assert.match(first.id, /^job_1700000000000_[0-9a-f-]{36}$/i);
    assert.notEqual(first.id, "caller-controlled");
    assert.notEqual(first.id, second.id);
    assert.equal(first.title, "First");
    assert.equal(first.status, "open");
    assert.equal(second.title, "Second");
    assert.equal(second.status, "draft");
  } finally {
    Date.now = originalNow;
  }
});
