import assert from "node:assert/strict";
import test from "node:test";

import { sendMessage } from "../services/messageService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";

test("collaboration resource ids remain server-owned", async () => {
  const message = await sendMessage({ id: "client-message-id", body: "hello" });
  const proposal = await createProposal({ id: "client-proposal-id", coverLetter: "ready" });
  const review = await createReview({ id: "client-review-id", rating: 5 });

  assert.match(message.id, /^msg_\d+$/);
  assert.match(proposal.id, /^prp_\d+$/);
  assert.match(review.id, /^rev_\d+$/);

  assert.notEqual(message.id, "client-message-id");
  assert.notEqual(proposal.id, "client-proposal-id");
  assert.notEqual(review.id, "client-review-id");
});
