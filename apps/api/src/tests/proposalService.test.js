import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal keeps proposal ids server-generated", async () => {
  const coverLetter = `server-owned proposal id ${Date.now()}`;
  const proposal = await createProposal({
    id: "client_supplied_proposal_id",
    jobId: "job_123",
    freelancerId: "usr_freelancer",
    coverLetter
  });

  assert.match(proposal.id, /^prp_/);
  assert.notEqual(proposal.id, "client_supplied_proposal_id");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_freelancer");
  assert.equal(proposal.coverLetter, coverLetter);

  const storedProposals = await listProposals();
  const storedProposal = storedProposals.find((stored) => stored.coverLetter === coverLetter);

  assert.ok(storedProposal);
  assert.equal(storedProposal.id, proposal.id);
});
