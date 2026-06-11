import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal preserves the generated proposal id over payload id", async () => {
  const proposal = await createProposal({
    id: "prp_client_supplied",
    jobId: "job_123",
    freelancerId: "usr_123",
    coverLetter: "Focused proposal",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "prp_client_supplied");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_123");
  assert.equal(proposal.coverLetter, "Focused proposal");

  const stored = (await listProposals()).find((entry) => entry.jobId === "job_123");
  assert.equal(stored?.id, proposal.id);
});