import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

function proposalPayload(overrides = {}) {
  return {
    coverLetter: "I can deliver this quickly.",
    bidAmount: 1200,
    estDuration: "2 weeks",
    jobId: "job_123",
    freelancerId: "usr_freelancer",
    ...overrides
  };
}

test("createProposal assigns a server-owned createdAt timestamp", async () => {
  const proposal = await createProposal(proposalPayload());

  assert.equal(typeof proposal.createdAt, "string");
  assert.ok(!Number.isNaN(Date.parse(proposal.createdAt)));
});

test("createProposal ignores caller-supplied createdAt timestamps", async () => {
  const callerTimestamp = "1999-01-01T00:00:00.000Z";
  const proposal = await createProposal(proposalPayload({ createdAt: callerTimestamp }));

  assert.notEqual(proposal.createdAt, callerTimestamp);
  assert.ok(!Number.isNaN(Date.parse(proposal.createdAt)));
});
