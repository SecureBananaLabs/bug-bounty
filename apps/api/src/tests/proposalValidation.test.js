import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this safely.",
  bidAmount: 250,
  estDuration: "2 weeks"
};

test("proposal creation requires estimated duration", () => {
  const { estDuration, ...payload } = validProposal;

  const result = createProposalSchema.safeParse(payload);

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "estDuration");
});

test("proposal creation rejects blank estimated duration", () => {
  const result = createProposalSchema.safeParse({
    ...validProposal,
    estDuration: ""
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "estDuration");
});

test("proposal creation accepts estimated duration", () => {
  const result = createProposalSchema.safeParse(validProposal);

  assert.equal(result.success, true);
  assert.equal(result.data.estDuration, "2 weeks");
});
