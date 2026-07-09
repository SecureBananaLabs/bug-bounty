import { createReviewSchema } from '../validators/review.js';

// Test 1: Valid review
const r1 = createReviewSchema.safeParse({ rating: 5, comment: "Great work!", jobId: "job_1", reviewerId: "usr_1" });
if (!r1.success) throw new Error("Test 1 failed: valid review should pass");
console.log("PASS: valid review accepted");

// Test 2: Rating too high (6)
const r2 = createReviewSchema.safeParse({ rating: 6, comment: "Too high", jobId: "job_1", reviewerId: "usr_1" });
if (r2.success) throw new Error("Test 2 failed: rating 6 should be rejected");
console.log("PASS: rating 6 rejected");

// Test 3: Rating too low (0)
const r3 = createReviewSchema.safeParse({ rating: 0, comment: "Too low", jobId: "job_1", reviewerId: "usr_1" });
if (r3.success) throw new Error("Test 3 failed: rating 0 should be rejected");
console.log("PASS: rating 0 rejected");

// Test 4: Empty comment
const r4 = createReviewSchema.safeParse({ rating: 3, comment: "", jobId: "job_1", reviewerId: "usr_1" });
if (r4.success) throw new Error("Test 4 failed: empty comment should be rejected");
console.log("PASS: empty comment rejected");

// Test 5: Rating 1 (min valid)
const r5 = createReviewSchema.safeParse({ rating: 1, comment: "Poor", jobId: "job_1", reviewerId: "usr_1" });
if (!r5.success) throw new Error("Test 5 failed: rating 1 should be valid");
console.log("PASS: rating 1 accepted");

// Test 6: Rating 5 (max valid)
const r6 = createReviewSchema.safeParse({ rating: 5, comment: "Excellent", jobId: "job_1", reviewerId: "usr_1" });
if (!r6.success) throw new Error("Test 6 failed: rating 5 should be valid");
console.log("PASS: rating 5 accepted");

// Test 7: Non-integer rating
const r7 = createReviewSchema.safeParse({ rating: 3.5, comment: "Okay", jobId: "job_1", reviewerId: "usr_1" });
if (r7.success) throw new Error("Test 7 failed: non-integer rating should be rejected");
console.log("PASS: non-integer rating rejected");

// Test 8: Missing jobId
const r8 = createReviewSchema.safeParse({ rating: 3, comment: "No job", reviewerId: "usr_1" });
if (r8.success) throw new Error("Test 8 failed: missing jobId should be rejected");
console.log("PASS: missing jobId rejected");

console.log("\nAll 8 tests passed!");
