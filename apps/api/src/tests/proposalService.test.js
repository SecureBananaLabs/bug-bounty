import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps server-owned ids authoritative", async () => {
  const proposal = await createProposal({
    id: "client-controlled-id",
    jobId: "job_123",
    coverLetter: "I can help.",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "client-controlled-id");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.coverLetter, "I can help.");
});
