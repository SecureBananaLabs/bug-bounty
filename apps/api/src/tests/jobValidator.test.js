import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

function validJob(overrides = {}) {
  return {
    title: "Build API",
    description: "Build a reliable API service",
    budgetMin: 0,
    budgetMax: 1000,
    categoryId: "cat_api",
    skills: ["Node.js"],
    ...overrides
  };
}

test("createJobSchema accepts finite nonnegative budget values", () => {
  const payload = createJobSchema.parse(validJob());

  assert.equal(payload.budgetMin, 0);
  assert.equal(payload.budgetMax, 1000);
});

test("createJobSchema rejects non-finite minimum budgets", () => {
  for (const budgetMin of [Infinity, -Infinity, NaN]) {
    assert.throws(
      () => createJobSchema.parse(validJob({ budgetMin })),
      /budgetMin/
    );
  }
});

test("createJobSchema rejects non-finite maximum budgets", () => {
  for (const budgetMax of [Infinity, -Infinity, NaN]) {
    assert.throws(
      () => createJobSchema.parse(validJob({ budgetMax })),
      /budgetMax/
    );
  }
});
