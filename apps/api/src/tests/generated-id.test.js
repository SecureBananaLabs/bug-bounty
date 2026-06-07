import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

test("services do not allow payload ids to override generated ids", async () => {
  const user = await createUser({ id: "usr_attacker", email: "a@example.com" });
  const proposal = await createProposal({ id: "prp_attacker", jobId: "job_1" });
  const review = await createReview({ id: "rev_attacker", rating: 5 });

  assert.match(user.id, /^usr_\d+$/);
  assert.match(proposal.id, /^prp_\d+$/);
  assert.match(review.id, /^rev_\d+$/);
});
