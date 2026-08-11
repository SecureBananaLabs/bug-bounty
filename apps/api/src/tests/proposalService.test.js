import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps proposal ids server-owned", async () => {
  const proposal = await createProposal({
    id: "prp_attacker",
    jobId: "job_1",
    freelancerId: "usr_1",
    coverLetter: "I can complete this work with a focused delivery plan."
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "prp_attacker");
  assert.equal(proposal.jobId, "job_1");
  assert.equal(proposal.freelancerId, "usr_1");
});
