import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A long enough description",
    budgetMin: 1000,
    budgetMax: 500,
    categoryId: "cat_1"
  });
  assert.equal(result.success, false);
});

test("createJobSchema accepts valid budget ranges", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A long enough description",
    budgetMin: 500,
    budgetMax: 1000,
    categoryId: "cat_1"
  });
  assert.equal(result.success, true);
});

test("createJobSchema accepts equal budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A long enough description",
    budgetMin: 500,
    budgetMax: 500,
    categoryId: "cat_1"
  });
  assert.equal(result.success, true);
});
