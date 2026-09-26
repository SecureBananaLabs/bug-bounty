import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-generated proposal id", async () => {
  const proposal = await createProposal({
    id: "prp_client_controlled",
    jobId: "job_123",
    freelancerId: "usr_456",
    amount: 500,
    coverLetter: "I can deliver this fast."
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
  assert.equal(proposal.amount, 500);
  assert.equal(proposal.coverLetter, "I can deliver this fast.");
});
