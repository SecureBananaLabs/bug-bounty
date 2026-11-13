import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";

function assertIsoTimestamp(value) {
  assert.equal(typeof value, "string");
  assert.equal(Number.isNaN(Date.parse(value)), false);
  assert.equal(new Date(value).toISOString(), value);
}

test("proposal records include a createdAt timestamp", async () => {
  const proposal = await createProposal({
    coverLetter: "test",
    bidAmount: 500,
    estDuration: "2 weeks",
    jobId: "job_test",
    freelancerId: "usr_test"
  });

  assertIsoTimestamp(proposal.createdAt);
});

test("review records include a createdAt timestamp", async () => {
  const review = await createReview({
    jobId: "job_test",
    reviewerId: "usr_test",
    revieweeId: "usr_other",
    rating: 5,
    comment: "great"
  });

  assertIsoTimestamp(review.createdAt);
});

test("message records include createdAt while preserving sentAt", async () => {
  const message = await sendMessage({
    senderId: "usr_test",
    recipientId: "usr_other",
    body: "hello"
  });

  assertIsoTimestamp(message.createdAt);
  assertIsoTimestamp(message.sentAt);
  assert.equal(message.sentAt, message.createdAt);
});

test("notification records include a createdAt timestamp", async () => {
  const notification = await createNotification({
    userId: "usr_test",
    type: "system",
    message: "hello"
  });

  assertIsoTimestamp(notification.createdAt);
});
