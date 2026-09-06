import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget range (budgetMax < budgetMin)", () => {
  const invalidPayload = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat-1",
    skills: []
  };

  const result = createJobSchema.safeParse(invalidPayload);
  assert.equal(result.success, false, "Should reject inverted budget range");
  if (!result.success) {
    const hasBudgetError = result.error.errors.some(
      (e) => e.path.includes("budgetMax") && e.message.includes("budgetMax")
    );
    assert.equal(hasBudgetError, true, "Error should mention budgetMax validation");
  }
});

test("createJobSchema accepts valid budget range (budgetMax >= budgetMin)", () => {
  const validPayload = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat-1",
    skills: []
  };

  const result = createJobSchema.safeParse(validPayload);
  assert.equal(result.success, true, "Should accept valid budget range");
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const validPayload = {
    title: "Fixed Budget Job",
    description: "This job has a fixed budget",
    budgetMin: 300,
    budgetMax: 300,
    categoryId: "cat-1",
    skills: []
  };

  const result = createJobSchema.safeParse(validPayload);
  assert.equal(result.success, true, "Should accept equal budget values");
});

test("updateJobSchema rejects inverted budget range when both fields present", () => {
  const invalidPayload = {
    title: "Updated Job",
    description: "Updated description",
    budgetMin: 800,
    budgetMax: 200,
    categoryId: "cat-1",
    skills: []
  };

  const result = updateJobSchema.safeParse(invalidPayload);
  assert.equal(result.success, false, "Should reject inverted budget range in update");
});

test("updateJobSchema accepts partial update with valid budget", () => {
  const partialPayload = {
    title: "Partially Updated Job"
  };

  const result = updateJobSchema.safeParse(partialPayload);
  assert.equal(result.success, true, "Should accept partial update without budget fields");
});

test("updateJobSchema accepts update with valid budget range", () => {
  const validPayload = {
    budgetMin: 200,
    budgetMax: 400
  };

  const result = updateJobSchema.safeParse(validPayload);
  assert.equal(result.success, true, "Should accept update with valid budget range");
});
