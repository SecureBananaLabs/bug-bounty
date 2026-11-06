import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps proposal ids server-generated", async () => {
  const proposal = await createProposal({
    id: "attacker_id",
    jobId: "job_1",
    freelancerId: "user_1",
    bidAmount: 250,
    coverLetter: "I can help",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "attacker_id");
  assert.equal(proposal.jobId, "job_1");
  assert.equal(proposal.freelancerId, "user_1");
  assert.equal(proposal.bidAmount, 250);
  assert.equal(proposal.coverLetter, "I can help");
});
