import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget ranges", () => {
  const inverted = {
    title: "Test Job",
    description: "A test job description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat_1",
    skills: []
  };

  assert.throws(
    () => createJobSchema.parse(inverted),
    { message: /budgetMax must be greater than or equal to budgetMin/ }
  );
});

test("createJobSchema accepts valid budget ranges", () => {
  const valid = {
    title: "Test Job",
    description: "A test job description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_1",
    skills: []
  };

  const result = createJobSchema.parse(valid);
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema accepts equal budget values", () => {
  const equal = {
    title: "Test Job",
    description: "A test job description",
    budgetMin: 300,
    budgetMax: 300,
    categoryId: "cat_1",
    skills: []
  };

  const result = createJobSchema.parse(equal);
  assert.equal(result.budgetMin, 300);
  assert.equal(result.budgetMax, 300);
});

test("updateJobSchema rejects inverted budget ranges when both present", () => {
  const inverted = {
    budgetMin: 500,
    budgetMax: 100
  };

  assert.throws(
    () => updateJobSchema.parse(inverted),
    { message: /budgetMax must be greater than or equal to budgetMin/ }
  );
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const partial = { budgetMin: 200 };
  const result = updateJobSchema.parse(partial);
  assert.equal(result.budgetMin, 200);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const partial = { budgetMax: 800 };
  const result = updateJobSchema.parse(partial);
  assert.equal(result.budgetMax, 800);
});

test("updateJobSchema accepts valid budget ranges when both present", () => {
  const valid = { budgetMin: 100, budgetMax: 500 };
  const result = updateJobSchema.parse(valid);
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});
