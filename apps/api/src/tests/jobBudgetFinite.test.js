import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build marketplace",
  description: "Build a marketplace workflow",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_dev",
  skills: ["api"]
};

test("createJobSchema rejects non-finite budget values", () => {
  for (const value of [Infinity, -Infinity, NaN]) {
    assert.throws(() => createJobSchema.parse({ ...validJob, budgetMin: value }));
    assert.throws(() => createJobSchema.parse({ ...validJob, budgetMax: value }));
  }
});

test("updateJobSchema rejects non-finite budget values", () => {
  for (const value of [Infinity, -Infinity, NaN]) {
    assert.throws(() => updateJobSchema.parse({ budgetMin: value }));
    assert.throws(() => updateJobSchema.parse({ budgetMax: value }));
  }
});

test("createJobSchema keeps finite nonnegative budget values valid", () => {
  const parsed = createJobSchema.parse(validJob);

  assert.equal(parsed.budgetMin, 100);
  assert.equal(parsed.budgetMax, 500);
});
