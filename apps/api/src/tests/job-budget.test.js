import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("#2853 createJobSchema: rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test job posting",
    description: "A detailed description of the job that is long enough",
    budgetMin: 500,
    budgetMax: 100,  // inverted!
    categoryId: "cat_1",
    skills: ["javascript"]
  });

  assert.equal(result.success, false, "should reject inverted budget");
  assert.ok(
    result.error.issues.some(i => i.message.includes("budgetMax")),
    `error should mention budgetMax, got: ${JSON.stringify(result.error.issues)}`
  );
});

test("#2853 createJobSchema: accepts valid budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test job posting",
    description: "A detailed description of the job that is long enough",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_1",
    skills: ["javascript"]
  });

  assert.equal(result.success, true, "should accept valid budget range");
});

test("#2853 createJobSchema: accepts equal min/max", () => {
  const result = createJobSchema.safeParse({
    title: "Fixed price job",
    description: "A detailed description of the job that is long enough",
    budgetMin: 300,
    budgetMax: 300,
    categoryId: "cat_1"
  });

  assert.equal(result.success, true, "should accept equal min/max");
});

test("#2853 updateJobSchema: partial updates also validate budget range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 500  // inverted
  });

  assert.equal(result.success, false, "should reject inverted budget in partial update");
});
