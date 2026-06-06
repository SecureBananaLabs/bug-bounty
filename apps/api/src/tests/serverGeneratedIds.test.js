import test from "node:test";
import assert from "node:assert/strict";

import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

test("createUser keeps the server-generated id authoritative", async () => {
  const user = await createUser({ id: "usr_attacker", email: "user@example.com" });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker");
  assert.equal(user.email, "user@example.com");
});

test("createProposal keeps the server-generated id authoritative", async () => {
  const proposal = await createProposal({ id: "prp_attacker", jobId: "job_1" });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "prp_attacker");
  assert.equal(proposal.jobId, "job_1");
});

test("createReview keeps the server-generated id authoritative", async () => {
  const review = await createReview({ id: "rev_attacker", rating: 5 });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "rev_attacker");
  assert.equal(review.rating, 5);
});
