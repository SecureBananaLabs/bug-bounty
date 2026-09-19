import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal ignores caller supplied id", async () => {
  const proposal = await createProposal({
    id: "prp_attacker_controlled",
    jobId: "job_123",
    freelancerId: "usr_freelancer",
    coverLetter: "I can help with this.",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "prp_attacker_controlled");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_freelancer");
  assert.equal(proposal.coverLetter, "I can help with this.");
});
