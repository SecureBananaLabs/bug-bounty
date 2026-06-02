import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema accepts finite nonnegative budgets", () => {
  const payload = createJobSchema.parse({
    title: "Build feature",
    description: "Implement a useful feature for the marketplace.",
    budgetMin: 0,
    budgetMax: 500,
    categoryId: "cat_1",
    skills: ["nodejs"]
  });

  assert.equal(payload.budgetMin, 0);
  assert.equal(payload.budgetMax, 500);
});

test("createJobSchema rejects non-finite budgets", () => {
  assert.throws(() => {
    createJobSchema.parse({
      title: "Build feature",
      description: "Implement a useful feature for the marketplace.",
      budgetMin: Number.POSITIVE_INFINITY,
      budgetMax: 500,
      categoryId: "cat_1",
      skills: ["nodejs"]
    });
  });

  assert.throws(() => {
    createJobSchema.parse({
      title: "Build feature",
      description: "Implement a useful feature for the marketplace.",
      budgetMin: 0,
      budgetMax: Number.NaN,
      categoryId: "cat_1",
      skills: ["nodejs"]
    });
  });
});
