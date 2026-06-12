import assert from "node:assert/strict";
import test from "node:test";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

test("createUser keeps the generated id server-owned", async () => {
  const user = await createUser({
    id: "usr_attacker",
    email: "freelancer@example.com",
    role: "freelancer"
  });

  assert.match(user.id, /^usr_\d+$/);
  assert.notEqual(user.id, "usr_attacker");
  assert.equal(user.email, "freelancer@example.com");
  assert.equal(user.role, "freelancer");
});

test("createProposal keeps the generated id server-owned", async () => {
  const proposal = await createProposal({
    id: "prp_attacker",
    jobId: "job_123",
    freelancerId: "usr_456",
    bidAmount: 500
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "prp_attacker");
  assert.equal(proposal.jobId, "job_123");
  assert.equal(proposal.freelancerId, "usr_456");
  assert.equal(proposal.bidAmount, 500);
});

test("createReview keeps the generated id server-owned", async () => {
  const review = await createReview({
    id: "rev_attacker",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "rev_attacker");
  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.revieweeId, "usr_reviewee");
  assert.equal(review.rating, 5);
});

test("sendMessage keeps id and sentAt server-owned", async () => {
  const message = await sendMessage({
    id: "msg_attacker",
    sentAt: "1999-01-01T00:00:00.000Z",
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "Hello"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_attacker");
  assert.notEqual(message.sentAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(message.sentAt).toISOString());
  assert.equal(message.body, "Hello");
});

test("createNotification keeps id and read server-owned", async () => {
  const notification = await createNotification({
    id: "ntf_attacker",
    read: true,
    userId: "usr_123",
    title: "Proposal update",
    body: "A freelancer responded"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_attacker");
  assert.equal(notification.read, false);
  assert.equal(notification.title, "Proposal update");
  assert.equal(notification.body, "A freelancer responded");
});
