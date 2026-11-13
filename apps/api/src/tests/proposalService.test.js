import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-generated proposal id", async () => {
  const proposal = await createProposal({
    id: "attacker-controlled-id",
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can complete this project safely.",
    amount: 500
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "attacker-controlled-id");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
});
