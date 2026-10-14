import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

test("createProposalSchema - validation checks", () => {
  // Valid proposal
  const validData = {
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can complete this safely.",
    bidAmount: 250,
    estDuration: "3 days",
  };

  const parsed = createProposalSchema.safeParse(validData);
  assert.ok(parsed.success);

  // Missing estDuration
  const missingDuration = {
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can complete this safely.",
    bidAmount: 250,
  };
  const parsedMissing = createProposalSchema.safeParse(missingDuration);
  assert.ok(!parsedMissing.success);

  // Blank estDuration
  const blankDuration = {
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can complete this safely.",
    bidAmount: 250,
    estDuration: "",
  };
  const parsedBlank = createProposalSchema.safeParse(blankDuration);
  assert.ok(!parsedBlank.success);

  // Non-positive bidAmount
  const badBid = {
    jobId: "job_123",
    freelancerId: "usr_456",
    coverLetter: "I can complete this safely.",
    bidAmount: -10,
    estDuration: "3 days",
  };
  const parsedBadBid = createProposalSchema.safeParse(badBid);
  assert.ok(!parsedBadBid.success);
});
