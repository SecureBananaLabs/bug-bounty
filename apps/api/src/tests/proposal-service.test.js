import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-generated id", async () => {
  const proposal = await createProposal({
    id: "client_controlled_id",
    jobId: "job_123",
    freelancerId: "usr_123",
    bidAmount: 250,
    coverLetter: "I can help with this project."
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "client_controlled_id");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_123");
  assert.equal(proposal.bidAmount, 250);
  assert.equal(proposal.coverLetter, "I can help with this project.");
});
