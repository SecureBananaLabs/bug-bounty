import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves generated ids", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const proposal = await createProposal({
      id: "prp_client_controlled",
      jobId: "job_123",
      freelancerId: "usr_456",
      rate: 120,
      message: "I can complete this job."
    });

    assert.equal(proposal.id, "prp_1710000000000");
    assert.equal(proposal.jobId, "job_123");
    assert.equal(proposal.freelancerId, "usr_456");
    assert.equal(proposal.rate, 120);
    assert.equal(proposal.message, "I can complete this job.");
  } finally {
    Date.now = originalNow;
  }
});
