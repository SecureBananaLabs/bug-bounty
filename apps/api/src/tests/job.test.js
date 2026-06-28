import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Test Job",
  description: "A comprehensive test job description for validation checks",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat-123",
  skills: ["javascript"],
};

test("createJobSchema accepts valid job data", () => {
  const result = createJobSchema.safeParse(validJob);
  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range", () => {
  const invalid = { ...validJob, budgetMin: 500, budgetMax: 100 };
  const result = createJobSchema.safeParse(invalid);
  assert.equal(result.success, false);
});

test("createJobSchema returns correct error path for inverted budget", () => {
  const invalid = { ...validJob, budgetMin: 500, budgetMax: 100 };
  const result = createJobSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.ok(result.error);
  const budgetMaxError = result.error.errors.find((e) =>
    e.path.includes("budgetMax")
  );
  assert.ok(budgetMaxError, "Expected an error on budgetMax field");
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const equal = { ...validJob, budgetMin: 300, budgetMax: 300 };
  const result = createJobSchema.safeParse(equal);
  assert.equal(result.success, true);
});

test("createJobSchema rejects negative budget values", () => {
  const negative = { ...validJob, budgetMin: -1 };
  const result = createJobSchema.safeParse(negative);
  assert.equal(result.success, false);
});
