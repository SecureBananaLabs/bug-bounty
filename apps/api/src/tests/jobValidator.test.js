import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build search filters",
  description: "Add search filters for client project discovery.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_web",
  skills: ["node"]
};

test("createJobSchema rejects non-finite budget values", () => {
  for (const value of [Infinity, -Infinity, NaN]) {
    assert.equal(createJobSchema.safeParse({ ...validJob, budgetMin: value }).success, false);
    assert.equal(createJobSchema.safeParse({ ...validJob, budgetMax: value }).success, false);
  }
});

test("updateJobSchema rejects non-finite budget values", () => {
  for (const value of [Infinity, -Infinity, NaN]) {
    assert.equal(updateJobSchema.safeParse({ budgetMin: value }).success, false);
    assert.equal(updateJobSchema.safeParse({ budgetMax: value }).success, false);
  }
});

test("createJobSchema accepts finite nonnegative budget values", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
  assert.equal(result.data.budgetMin, 100);
  assert.equal(result.data.budgetMax, 500);
});
