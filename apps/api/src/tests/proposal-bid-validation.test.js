import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

const validPayload = {
  coverLetter: "I can deliver this on time",
  bidAmount: 500,
  estDuration: "2 weeks",
  jobId: "job_123",
  freelancerId: "usr_456"
};

test("createProposalSchema rejects zero bidAmount", () => {
  const result = createProposalSchema.safeParse({ ...validPayload, bidAmount: 0 });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("bidAmount")));
});

test("createProposalSchema rejects negative bidAmount", () => {
  const result = createProposalSchema.safeParse({ ...validPayload, bidAmount: -100 });
  assert.equal(result.success, false);
});

test("createProposalSchema rejects non-numeric bidAmount", () => {
  const result = createProposalSchema.safeParse({ ...validPayload, bidAmount: "free" });
  assert.equal(result.success, false);
});

test("createProposalSchema accepts valid positive bidAmount", () => {
  const result = createProposalSchema.safeParse({ ...validPayload, bidAmount: 1500 });
  assert.equal(result.success, true);
  assert.equal(result.data.bidAmount, 1500);
});

test("createProposalSchema accepts decimal bidAmount", () => {
  const result = createProposalSchema.safeParse({ ...validPayload, bidAmount: 99.99 });
  assert.equal(result.success, true);
  assert.equal(result.data.bidAmount, 99.99);
});

test("createProposalSchema rejects missing bidAmount", () => {
  const { bidAmount, ...noBid } = validPayload;
  const result = createProposalSchema.safeParse(noBid);
  assert.equal(result.success, false);
});
