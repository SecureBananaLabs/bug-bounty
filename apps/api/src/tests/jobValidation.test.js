import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget ranges", () => {
  const invalidPayload = {
    title: "Fix the thing",
    description: "This is a detailed description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat_1"
  };
  assert.throws(() => createJobSchema.parse(invalidPayload), {
    message: /budgetMax must be greater than or equal to budgetMin/
  });
});

test("createJobSchema accepts equal budget range", () => {
  const validPayload = {
    title: "Fix the thing",
    description: "This is a detailed description",
    budgetMin: 500,
    budgetMax: 500,
    categoryId: "cat_1"
  };
  const result = createJobSchema.parse(validPayload);
  assert.equal(result.budgetMin, 500);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema accepts valid budget range", () => {
  const validPayload = {
    title: "Fix the thing",
    description: "This is a detailed description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_1"
  };
  const result = createJobSchema.parse(validPayload);
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("updateJobSchema rejects inverted budget on partial update", () => {
  const invalidPayload = {
    budgetMin: 500,
    budgetMax: 100
  };
  assert.throws(() => updateJobSchema.parse(invalidPayload), {
    message: /budgetMax must be greater than or equal to budgetMin/
  });
});

test("updateJobSchema allows single-field partial update", () => {
  const validPayload = { budgetMin: 300 };
  const result = updateJobSchema.parse(validPayload);
  assert.equal(result.budgetMin, 300);
  assert.ok(!("budgetMax" in result));
});

test("updateJobSchema accepts valid budget range on partial update", () => {
  const validPayload = {
    budgetMin: 100,
    budgetMax: 500
  };
  const result = updateJobSchema.parse(validPayload);
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});
