import test from "node:test";
import assert from "node:assert/strict";
import {
  createMessageSchema,
  createPaymentSchema,
  createProposalSchema,
  createReviewSchema
} from "../validators/marketplace.js";

test("createProposalSchema rejects non-positive bid amounts", () => {
  const result = createProposalSchema.safeParse({
    coverLetter: "I can deliver this project",
    bidAmount: -1,
    estDuration: "1 week",
    jobId: "job_1",
    freelancerId: "user_1"
  });

  assert.equal(result.success, false);
});

test("createProposalSchema accepts a valid proposal payload", () => {
  const result = createProposalSchema.safeParse({
    coverLetter: "I can deliver this project",
    bidAmount: 250,
    estDuration: "1 week",
    jobId: "job_1",
    freelancerId: "user_1"
  });

  assert.equal(result.success, true);
});

test("createMessageSchema rejects blank bodies and self messages", () => {
  assert.equal(
    createMessageSchema.safeParse({
      body: "   ",
      senderId: "user_1",
      receiverId: "user_2"
    }).success,
    false
  );
  assert.equal(
    createMessageSchema.safeParse({
      body: "Hello",
      senderId: "user_1",
      receiverId: "user_1"
    }).success,
    false
  );
});

test("createMessageSchema accepts a valid message payload", () => {
  const result = createMessageSchema.safeParse({
    body: "Hello",
    senderId: "user_1",
    receiverId: "user_2"
  });

  assert.equal(result.success, true);
});

test("createPaymentSchema rejects non-positive payment amounts", () => {
  const result = createPaymentSchema.safeParse({
    amount: 0,
    currency: "usd",
    jobId: "job_1"
  });

  assert.equal(result.success, false);
});

test("createPaymentSchema accepts a valid payment payload", () => {
  const result = createPaymentSchema.safeParse({
    amount: 100,
    jobId: "job_1"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.currency, "usd");
});

test("createReviewSchema rejects out-of-range ratings and self reviews", () => {
  assert.equal(
    createReviewSchema.safeParse({
      rating: 6,
      comment: "Great",
      reviewerId: "user_1",
      revieweeId: "user_2"
    }).success,
    false
  );
  assert.equal(
    createReviewSchema.safeParse({
      rating: 5,
      comment: "Great",
      reviewerId: "user_1",
      revieweeId: "user_1"
    }).success,
    false
  );
});

test("createReviewSchema accepts a valid review payload", () => {
  const result = createReviewSchema.safeParse({
    rating: 5,
    comment: "Great",
    reviewerId: "user_1",
    revieweeId: "user_2"
  });

  assert.equal(result.success, true);
});
