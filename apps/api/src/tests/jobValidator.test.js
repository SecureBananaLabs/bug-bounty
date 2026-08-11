import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API endpoint",
  description: "Implement the API endpoint for the bounty board.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "development",
  skills: ["node"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const parsed = createJobSchema.parse(validJob);

  assert.equal(parsed.budgetMin, 100);
  assert.equal(parsed.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
  assert.match(result.error.issues[0].message, /budgetMax/);
});

test("updateJobSchema rejects inverted ranges when both budgets are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema still accepts partial single-budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
});