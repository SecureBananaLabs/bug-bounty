import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this job with a clear delivery plan.",
  bidAmount: 250
};

test("createProposalSchema rejects empty proposal payloads", () => {
  const result = createProposalSchema.safeParse({});

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error.issues.map((issue) => issue.path.join(".")),
    ["jobId", "freelancerId", "coverLetter", "bidAmount"]
  );
});

test("createProposalSchema rejects non-positive bid amounts", () => {
  const result = createProposalSchema.safeParse({
    ...validProposal,
    bidAmount: 0
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "bidAmount");
});

test("createProposalSchema accepts valid proposal payloads", () => {
  const result = createProposalSchema.safeParse(validProposal);

  assert.equal(result.success, true);
});
