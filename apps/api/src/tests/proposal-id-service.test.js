import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal ignores caller-controlled id", async () => {
  const originalNow = Date.now;
  Date.now = () => 5678;

  try {
    const proposal = await createProposal({
      id: "caller_prp",
      jobId: "job_1",
      freelancerId: "usr_1"
    });

    assert.equal(proposal.id, "prp_5678");
    assert.equal(proposal.jobId, "job_1");
    assert.equal(proposal.freelancerId, "usr_1");
  } finally {
    Date.now = originalNow;
  }
});
