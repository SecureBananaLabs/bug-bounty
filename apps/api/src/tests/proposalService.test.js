import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-owned id", async () => {
  const proposal = await createProposal({
    id: "client_supplied_id",
    jobId: "job_123",
    freelancerId: "usr_freelancer",
    coverLetter: "I can complete this safely.",
    amount: 750
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "client_supplied_id");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_freelancer");
  assert.equal(proposal.coverLetter, "I can complete this safely.");
  assert.equal(proposal.amount, 750);
});
