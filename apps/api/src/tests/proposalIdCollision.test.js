import assert from "node:assert/strict";
import test from "node:test";

import { createProposal } from "../services/proposalService.js";

test("createProposal generates distinct ids even within the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1787930000000;

  try {
    const first = await createProposal({ jobId: "job_1", coverLetter: "first" });
    const second = await createProposal({ jobId: "job_1", coverLetter: "second" });

    assert.match(first.id, /^prp_[0-9a-f-]{36}$/);
    assert.match(second.id, /^prp_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);
    assert.equal(first.coverLetter, "first");
    assert.equal(second.coverLetter, "second");
  } finally {
    Date.now = originalNow;
  }
});
