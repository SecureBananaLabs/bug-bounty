import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves generated id", async () => {
  const proposal = await createProposal({
    freelancerId: "u1",
    jobId: "j1",
    id: "malicious_id"
  });
  
  assert.ok(proposal.id.startsWith("prp_"));
  assert.notEqual(proposal.id, "malicious_id");
  assert.equal(proposal.freelancerId, "u1");
  assert.equal(proposal.jobId, "j1");
});
