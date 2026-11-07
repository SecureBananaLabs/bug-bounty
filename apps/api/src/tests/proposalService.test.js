import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("proposal IDs are server-owned and unique within the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1770000000000;

  try {
    const first = await createProposal({
      id: "caller-controlled",
      jobId: "job-1",
      freelancerId: "user-1",
      bidAmount: 125,
      coverLetter: "First proposal"
    });
    const second = await createProposal({
      jobId: "job-1",
      freelancerId: "user-2",
      bidAmount: 130,
      coverLetter: "Second proposal"
    });

    assert.notEqual(first.id, "caller-controlled");
    assert.match(first.id, /^prp_1770000000000_[0-9a-f-]{36}$/);
    assert.match(second.id, /^prp_1770000000000_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);

    assert.equal(first.jobId, "job-1");
    assert.equal(first.freelancerId, "user-1");
    assert.equal(first.bidAmount, 125);
    assert.equal(first.coverLetter, "First proposal");
  } finally {
    Date.now = originalNow;
  }
});
