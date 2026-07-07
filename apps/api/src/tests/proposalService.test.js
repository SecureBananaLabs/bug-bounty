import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps proposal ids server-owned", async () => {
  const proposal = await createProposal({
    id: "prp_caller_controlled",
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can deliver this project."
  });

  assert.match(proposal.id, /^prp_[0-9a-f-]{36}$/);
  assert.notEqual(proposal.id, "prp_caller_controlled");
  assert.equal(proposal.jobId, "job_123");
});

test("createProposal generates distinct ids for same-millisecond proposals", async () => {
  const originalDateNow = Date.now;
  Date.now = () => 1234567890;

  try {
    const first = await createProposal({ jobId: "job_123", freelancerId: "usr_1" });
    const second = await createProposal({ jobId: "job_123", freelancerId: "usr_2" });

    assert.match(first.id, /^prp_[0-9a-f-]{36}$/);
    assert.match(second.id, /^prp_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalDateNow;
  }
});
