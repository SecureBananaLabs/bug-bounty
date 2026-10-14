import assert from "node:assert/strict";
import test from "node:test";

import { createProposal } from "../services/proposalService.js";

test("createProposal ignores caller-supplied ids", async () => {
  const proposal = await createProposal({
    id: "prp_attacker",
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can deliver this in three days.",
    bidAmount: 250,
    estDuration: "3 days"
  });

  assert.notEqual(proposal.id, "prp_attacker");
  assert.match(proposal.id, /^prp_\d+$/);
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
  assert.equal(proposal.bidAmount, 250);
});
