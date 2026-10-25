import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves the server-generated proposal id", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const proposal = await createProposal({
      id: "client-controlled-id",
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can help with this job."
    });

    assert.equal(proposal.id, "prp_1710000000000");
    assert.equal(proposal.jobId, "job_123");
    assert.equal(proposal.freelancerId, "usr_456");
    assert.equal(proposal.coverLetter, "I can help with this job.");
  } finally {
    Date.now = originalNow;
  }
});
