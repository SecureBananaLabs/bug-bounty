import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps id server-owned", async () => {
  const proposal = await createProposal({
    id: "caller-controlled",
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can build this workflow.",
    bidAmount: 1200
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "caller-controlled");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
  assert.equal(proposal.bidAmount, 1200);
});
