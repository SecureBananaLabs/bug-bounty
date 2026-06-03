import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build marketplace API",
  description: "Create the marketplace job API",
  budgetMin: 0,
  budgetMax: 100,
  categoryId: "cat_1",
  skills: ["node"]
};

test("createJobSchema accepts finite nonnegative budgets", () => {
  const result = createJobSchema.parse(validJob);

  assert.equal(result.budgetMin, 0);
  assert.equal(result.budgetMax, 100);
});

test("createJobSchema rejects non-finite budget values", () => {
  for (const value of [Infinity, -Infinity, NaN]) {
    assert.throws(() => createJobSchema.parse({ ...validJob, budgetMin: value }));
    assert.throws(() => createJobSchema.parse({ ...validJob, budgetMax: value }));
  }
});
