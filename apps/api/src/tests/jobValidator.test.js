import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Logo design",
  description: "Create a clean logo concept.",
  budgetMin: 0,
  budgetMax: 250,
  categoryId: "design",
  skills: ["branding"]
};

test("createJobSchema accepts finite zero and positive budgets", () => {
  const zeroBudgetResult = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 0,
    budgetMax: 0
  });
  const positiveBudgetResult = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 100,
    budgetMax: 500
  });

  assert.equal(zeroBudgetResult.success, true);
  assert.equal(positiveBudgetResult.success, true);
});

test("createJobSchema rejects non-finite budgets", () => {
  for (const value of [Infinity, -Infinity, Number.NaN]) {
    assert.equal(createJobSchema.safeParse({ ...validJob, budgetMin: value }).success, false);
    assert.equal(createJobSchema.safeParse({ ...validJob, budgetMax: value }).success, false);
  }
});
