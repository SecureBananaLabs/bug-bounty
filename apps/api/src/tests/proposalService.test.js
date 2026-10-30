import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-generated id", async () => {
  const proposal = await createProposal({
    id: "malicious_id",
    jobId: "job_1",
    freelancerId: "freelancer_1",
    coverLetter: "I can help with this project.",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "malicious_id");
  assert.equal(proposal.jobId, "job_1");
  assert.equal(proposal.freelancerId, "freelancer_1");
  assert.equal(proposal.coverLetter, "I can help with this project.");
});
