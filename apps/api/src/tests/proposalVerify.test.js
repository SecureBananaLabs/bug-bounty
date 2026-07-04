import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal generated ID preservation", async () => {
  const payload = {
    jobId: "job_123",
    freelancerId: "usr_123",
    rate: 50,
    id: "hacked_proposal_id"
  };

  const proposal = await createProposal(payload);

  assert.notEqual(proposal.id, "hacked_proposal_id");
  assert.match(proposal.id, /^prp_/);
});
