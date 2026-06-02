import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-generated id", async () => {
  const originalNow = Date.now;
  Date.now = () => 1762000000000;

  try {
    const proposal = await createProposal({
      id: "client-controlled-id",
      jobId: "job_123",
      freelancerId: "usr_freelancer",
      bidAmount: 250,
      estimatedDuration: "3 days"
    });

    assert.equal(proposal.id, "prp_1762000000000");
    assert.equal(proposal.jobId, "job_123");
  } finally {
    Date.now = originalNow;
  }
});
