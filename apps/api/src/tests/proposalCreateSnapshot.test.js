import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal returns a defensive snapshot", async () => {
  const created = await createProposal({
    jobId: "job_snapshot",
    freelancerId: "user_snapshot",
    coverLetter: "Original cover letter"
  });

  created.coverLetter = "Mutated cover letter";

  const proposals = await listProposals();

  assert.equal(
    proposals.some((proposal) => proposal.coverLetter === "Mutated cover letter"),
    false
  );
  assert.equal(
    proposals.some((proposal) => proposal.coverLetter === "Original cover letter"),
    true
  );
});
