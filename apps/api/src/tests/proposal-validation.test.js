import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

test("createProposalSchema rejects missing estimatedDuration", () => {
  const result = createProposalSchema.safeParse({
    jobId: "job-1",
    amount: 500,
    description: "Will deliver the feature within the agreed timeline."
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("estimatedDuration")));
});

test("createProposalSchema accepts valid estimatedDuration", () => {
  const result = createProposalSchema.safeParse({
    jobId: "job-1",
    amount: 500,
    description: "Will deliver the feature within the agreed timeline.",
    estimatedDuration: 30
  });
  assert.equal(result.success, true);
});

test("createProposalSchema rejects non-positive estimatedDuration", () => {
  const result = createProposalSchema.safeParse({
    jobId: "job-1",
    amount: 500,
    description: "Will deliver the feature within the agreed timeline.",
    estimatedDuration: -5
  });
  assert.equal(result.success, false);
});