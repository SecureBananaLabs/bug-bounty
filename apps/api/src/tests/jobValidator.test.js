import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a landing page",
  description: "Create a polished landing page for launch.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["javascript"]
};

test("createJobSchema rejects budgets where max is below min", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 10
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});

test("createJobSchema accepts equal min and max budgets", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 250,
    budgetMax: 250
  });

  assert.equal(result.success, true);
});

test("updateJobSchema rejects invalid budget ranges when both values are provided", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 900,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema still accepts partial budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 900 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 900 }).success, true);
});