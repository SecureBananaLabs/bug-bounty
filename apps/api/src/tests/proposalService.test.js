import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps generated ids server-owned and preserves proposal payload", async () => {
  const proposal = await createProposal({
    id: "prp_client_supplied",
    jobId: "job_1",
    freelancerId: "usr_freelancer",
    coverLetter: "Hello",
    bidAmount: 250
  });

  assert.notEqual(proposal.id, "prp_client_supplied");
  assert.match(proposal.id, /^prp_\d+$/);
  assert.equal(proposal.jobId, "job_1");
  assert.equal(proposal.freelancerId, "usr_freelancer");
  assert.equal(proposal.coverLetter, "Hello");
  assert.equal(proposal.bidAmount, 250);
});

test("createProposal stores the generated id, not a spoofed caller id", async () => {
  const proposal = await createProposal({
    id: "prp_spoofed_storage_key",
    jobId: "job_2",
    freelancerId: "usr_other",
    coverLetter: "Second proposal"
  });

  assert.notEqual(proposal.id, "prp_spoofed_storage_key");
  assert.match(proposal.id, /^prp_\d+$/);
});
