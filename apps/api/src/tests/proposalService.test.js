import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, PROPOSAL_STATUS } from "../services/proposalService.js";

test("createProposal assigns a server-owned pending status", async () => {
  const proposal = await createProposal({
    coverLetter: "I can help with this project.",
    bidAmount: 500,
    estDuration: "2 weeks",
    jobId: "job_123",
    freelancerId: "usr_456",
    status: "ACCEPTED"
  });

  assert.equal(proposal.status, PROPOSAL_STATUS.pending);
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
});
