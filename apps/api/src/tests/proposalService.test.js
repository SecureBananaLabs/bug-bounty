import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal preserves server-owned fields", async () => {
  const proposal = await createProposal({
    id: "client_supplied_id",
    createdAt: "2000-01-01T00:00:00.000Z",
    coverLetter: "I can ship this marketplace project.",
    bidAmount: 1200,
    estDuration: "2 weeks",
    jobId: "job_123",
    freelancerId: "usr_456",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "client_supplied_id");
  assert.notEqual(proposal.createdAt, "2000-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(proposal.createdAt).toISOString());
  assert.equal(proposal.coverLetter, "I can ship this marketplace project.");
  assert.equal(proposal.bidAmount, 1200);
  assert.equal(proposal.estDuration, "2 weeks");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
});
