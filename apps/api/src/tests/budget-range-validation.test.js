import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget range", () => {
  assert.throws(
    () => createJobSchema.parse({
      title: "Test job",
      description: "A valid description here",
      budgetMin: 500,
      budgetMax: 100,
      categoryId: "web-dev"
    }),
    /budgetMax/
  );
});

test("createJobSchema accepts valid ordered budget range", () => {
  const result = createJobSchema.parse({
    title: "Test job",
    description: "A valid description here",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "web-dev"
  });
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema accepts equal budget min and max", () => {
  const result = createJobSchema.parse({
    title: "Fixed price job",
    description: "A valid description here",
    budgetMin: 300,
    budgetMax: 300,
    categoryId: "design"
  });
  assert.equal(result.budgetMin, 300);
  assert.equal(result.budgetMax, 300);
});

test("createJobSchema accepts zero budgets", () => {
  const result = createJobSchema.parse({
    title: "Volunteer work",
    description: "A valid description here",
    budgetMin: 0,
    budgetMax: 0,
    categoryId: "volunteer"
  });
  assert.equal(result.budgetMin, 0);
  assert.equal(result.budgetMax, 0);
});

test("updateJobSchema rejects inverted budget range when both present", () => {
  assert.throws(
    () => updateJobSchema.parse({
      budgetMin: 1000,
      budgetMax: 200
    }),
    /budgetMax/
  );
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const result = updateJobSchema.parse({ budgetMin: 500 });
  assert.equal(result.budgetMin, 500);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const result = updateJobSchema.parse({ budgetMax: 2000 });
  assert.equal(result.budgetMax, 2000);
});
