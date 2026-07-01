import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

const baseProposal = {
  jobId: "job_created_at",
  freelancerId: "freelancer_created_at",
  coverLetter: "I can deliver this quickly.",
  bidAmount: 300
};

test("createProposal assigns a server-generated createdAt timestamp", async () => {
  const proposal = await createProposal(baseProposal);

  assert.equal(typeof proposal.createdAt, "string");
  assert.equal(Number.isNaN(Date.parse(proposal.createdAt)), false);
});

test("createProposal ignores caller-supplied createdAt values", async () => {
  const callerCreatedAt = "2000-01-01T00:00:00.000Z";
  const before = Date.now();
  const proposal = await createProposal({
    ...baseProposal,
    jobId: "job_created_at_override",
    createdAt: callerCreatedAt
  });
  const after = Date.now();
  const createdAtTime = Date.parse(proposal.createdAt);

  assert.notEqual(proposal.createdAt, callerCreatedAt);
  assert.ok(createdAtTime >= before);
  assert.ok(createdAtTime <= after);
});
