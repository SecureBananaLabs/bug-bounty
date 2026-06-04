import test from "node:test";
import assert from "node:assert/strict";
import { createReviewSchema } from "../validators/review.js";

// ─── Valid review ────────────────────────────────────────────

test("createReviewSchema: accepts valid review", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 4,
    comment: "Great work, highly recommended!"
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 4,
    comment: "Great work, highly recommended!"
  });
});

test("createReviewSchema: accepts minimum rating (1)", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 1,
    comment: "Not great."
  });
  assert.equal(result.success, true);
});

test("createReviewSchema: accepts maximum rating (5)", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 5,
    comment: "Absolutely perfect!"
  });
  assert.equal(result.success, true);
});

// ─── Rating validation ───────────────────────────────────────

test("createReviewSchema: rejects rating below 1", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 0,
    comment: "Zero stars"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("rating")));
});

test("createReviewSchema: rejects negative rating", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: -5,
    comment: "Terrible"
  });
  assert.equal(result.success, false);
});

test("createReviewSchema: rejects rating above 5", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 10,
    comment: "Eleven out of five"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("rating")));
});

test("createReviewSchema: rejects non-integer rating", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 3.5,
    comment: "Half stars"
  });
  assert.equal(result.success, false);
});

// ─── Required fields ─────────────────────────────────────────

test("createReviewSchema: rejects missing jobId", () => {
  const result = createReviewSchema.safeParse({
    freelancerId: "usr_abc",
    rating: 4,
    comment: "Nice"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("jobId")));
});

test("createReviewSchema: rejects empty jobId", () => {
  const result = createReviewSchema.safeParse({
    jobId: "",
    freelancerId: "usr_abc",
    rating: 4,
    comment: "Nice"
  });
  assert.equal(result.success, false);
});

test("createReviewSchema: rejects missing freelancerId", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    rating: 4,
    comment: "Nice"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("freelancerId")));
});

test("createReviewSchema: rejects missing comment", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 4
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("comment")));
});

test("createReviewSchema: rejects empty comment", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 4,
    comment: ""
  });
  assert.equal(result.success, false);
});

// ─── Comment length limit ────────────────────────────────────

test("createReviewSchema: rejects comment exceeding 2000 chars", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 5,
    comment: "x".repeat(2001)
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("comment")));
});

test("createReviewSchema: accepts comment at exactly 2000 chars", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: 5,
    comment: "a".repeat(2000)
  });
  assert.equal(result.success, true);
});

// ─── Type validation ─────────────────────────────────────────

test("createReviewSchema: rejects string rating", () => {
  const result = createReviewSchema.safeParse({
    jobId: "job-101",
    freelancerId: "usr_abc",
    rating: "five",
    comment: "Nice"
  });
  assert.equal(result.success, false);
});

test("createReviewSchema: rejects empty payload", () => {
  const result = createReviewSchema.safeParse({});
  assert.equal(result.success, false);
  assert.ok(result.error.issues.length >= 4); // jobId, freelancerId, rating, comment
});
