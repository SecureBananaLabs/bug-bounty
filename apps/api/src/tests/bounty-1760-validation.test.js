import test from "node:test";
import assert from "node:assert/strict";
import {
  createUserSchema,
  createMessageSchema,
  createPaymentSchema,
  createReviewSchema,
  createProposalSchema,
  createNotificationSchema
} from "../validators/resource.js";

test("createUserSchema rejects missing email", () => {
  const result = createUserSchema.safeParse({ name: "Test" });
  assert.equal(result.success, false);
});

test("createMessageSchema rejects empty body", () => {
  const result = createMessageSchema.safeParse({ to: "user1", body: "" });
  assert.equal(result.success, false);
});

test("createPaymentSchema rejects negative amount", () => {
  const result = createPaymentSchema.safeParse({ amount: -10, recipientId: "u1" });
  assert.equal(result.success, false);
});

test("createReviewSchema rejects rating > 5", () => {
  const result = createReviewSchema.safeParse({ targetId: "u1", rating: 6 });
  assert.equal(result.success, false);
});

test("createProposalSchema rejects missing jobId", () => {
  const result = createProposalSchema.safeParse({ coverLetter: "Hi", price: 100 });
  assert.equal(result.success, false);
});

test("createNotificationSchema rejects missing type", () => {
  const result = createNotificationSchema.safeParse({ userId: "u1", message: "hi" });
  assert.equal(result.success, false);
});

test("createUserSchema accepts valid data", () => {
  const result = createUserSchema.safeParse({ email: "a@b.com", name: "Test" });
  assert.equal(result.success, true);
});
