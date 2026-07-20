import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";

test("createProposal ignores caller-controlled id", async () => {
  const proposal = await createProposal({
    id: "prp_attacker",
    jobId: "job_123",
    freelancerId: "usr_123",
    bidAmount: 100
  });

  assert.match(proposal.id, /^prp_/);
  assert.notEqual(proposal.id, "prp_attacker");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_123");
});

test("createReview ignores caller-controlled id", async () => {
  const review = await createReview({
    id: "rev_attacker",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5
  });

  assert.match(review.id, /^rev_/);
  assert.notEqual(review.id, "rev_attacker");
  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.revieweeId, "usr_reviewee");
});
