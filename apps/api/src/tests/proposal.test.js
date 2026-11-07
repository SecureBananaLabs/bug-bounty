import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

test("createProposalSchema accepts valid payload", () => {
  const result = createProposalSchema.safeParse({
    jobId: "job-123",
    freelancerId: "user-456",
    coverLetter: "I am very interested in this job and have the skills.",
    bidAmount: 500,
    estimatedDays: 7
  });
  assert.equal(result.success, true);
});

test("createProposalSchema rejects negative bidAmount", () => {
  const result = createProposalSchema.safeParse({
    jobId: "job-123",
    freelancerId: "user-456",
    coverLetter: "I am very interested in this job and have the skills.",
    bidAmount: -500,
    estimatedDays: 7
  });
  assert.equal(result.success, false);
});
