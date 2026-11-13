import test from "node:test";
import assert from "node:assert/strict";

import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";

function assertIsoTimestamp(value) {
  assert.equal(typeof value, "string");
  assert.ok(!Number.isNaN(Date.parse(value)), `expected parseable ISO timestamp, got ${value}`);
}

test("in-memory services return createdAt timestamps consistent with Prisma models", async () => {
  const proposal = await createProposal({
    coverLetter: "I can help",
    bidAmount: 500,
    estDuration: "2 weeks",
    jobId: "job_test",
    freelancerId: "usr_test",
  });
  assertIsoTimestamp(proposal.createdAt);

  const review = await createReview({
    rating: 5,
    comment: "Great work",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
  });
  assertIsoTimestamp(review.createdAt);

  const message = await sendMessage({
    body: "Hello there",
    senderId: "usr_sender",
    receiverId: "usr_receiver",
  });
  assertIsoTimestamp(message.createdAt);
  assert.equal(message.sentAt, message.createdAt);

  const notification = await createNotification({
    userId: "usr_notify",
    type: "message",
    title: "New message",
    body: "You have a new message",
  });
  assertIsoTimestamp(notification.createdAt);
});
