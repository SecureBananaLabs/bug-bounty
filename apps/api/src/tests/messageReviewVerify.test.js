import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";
import { createReview } from "../services/reviewService.js";

test("sendMessage generated ID preservation", async () => {
  const payload = {
    senderId: "usr_123",
    receiverId: "usr_456",
    content: "hello",
    id: "hacked_message_id"
  };

  const message = await sendMessage(payload);

  assert.notEqual(message.id, "hacked_message_id");
  assert.match(message.id, /^msg_/);
});

test("createReview generated ID preservation", async () => {
  const payload = {
    jobId: "job_123",
    reviewerId: "usr_123",
    revieweeId: "usr_456",
    rating: 5,
    comment: "Excellent",
    id: "hacked_review_id"
  };

  const review = await createReview(payload);

  assert.notEqual(review.id, "hacked_review_id");
  assert.match(review.id, /^rev_/);
});
