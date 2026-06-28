import test from "node:test";
import assert from "node:assert/strict";

test("proposal service includes createdAt", async () => {
  const { createProposal } = await import("../services/proposalService.js");
  const proposal = await createProposal({
    coverLetter: "I can do it",
    bidAmount: 500,
    estDuration: "2 weeks",
    jobId: "job_test",
    freelancerId: "usr_test"
  });

  assert.ok(proposal.createdAt, "proposal should have createdAt");
  assert.ok(
    !isNaN(Date.parse(proposal.createdAt)),
    "createdAt should be a valid ISO date"
  );
});

test("review service includes createdAt", async () => {
  const { createReview } = await import("../services/reviewService.js");
  const review = await createReview({
    rating: 5,
    comment: "Great work",
    reviewerId: "usr_a",
    revieweeId: "usr_b"
  });

  assert.ok(review.createdAt, "review should have createdAt");
  assert.ok(
    !isNaN(Date.parse(review.createdAt)),
    "createdAt should be a valid ISO date"
  );
});

test("notification service includes createdAt and defaults read to false", async () => {
  const { createNotification } = await import("../services/notificationService.js");
  const notification = await createNotification({
    userId: "usr_test",
    title: "New job posted",
    body: "Check it out",
    read: true
  });

  assert.ok(notification.createdAt, "notification should have createdAt");
  assert.ok(
    !isNaN(Date.parse(notification.createdAt)),
    "createdAt should be a valid ISO date"
  );
  assert.equal(notification.read, false, "read should default to false and not be overridable");
});

test("message service includes createdAt alongside sentAt", async () => {
  const { sendMessage } = await import("../services/messageService.js");
  const message = await sendMessage({
    senderId: "usr_a",
    receiverId: "usr_b",
    body: "Hello"
  });

  assert.ok(message.createdAt, "message should have createdAt");
  assert.ok(message.sentAt, "message should have sentAt");
  assert.ok(
    !isNaN(Date.parse(message.createdAt)),
    "createdAt should be a valid ISO date"
  );
});
