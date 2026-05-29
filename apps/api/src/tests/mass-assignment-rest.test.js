import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createNotification } from "../services/notificationService.js";

test("createProposal ignores caller-supplied id", async () => {
  const proposal = await createProposal({ id: "attacker_id", title: "test" });
  assert.notEqual(proposal.id, "attacker_id");
  assert.ok(proposal.id.startsWith("prp_"));
  assert.equal(proposal.title, "test");
});

test("createReview ignores caller-supplied id", async () => {
  const review = await createReview({ id: "attacker_id", rating: 5 });
  assert.notEqual(review.id, "attacker_id");
  assert.ok(review.id.startsWith("rev_"));
  assert.equal(review.rating, 5);
});

test("createNotification ignores caller-supplied id", async () => {
  const notification = await createNotification({ id: "attacker_id", message: "test" });
  assert.notEqual(notification.id, "attacker_id");
  assert.ok(notification.id.startsWith("ntf_"));
  assert.equal(notification.message, "test");
  assert.equal(notification.read, false);
});
