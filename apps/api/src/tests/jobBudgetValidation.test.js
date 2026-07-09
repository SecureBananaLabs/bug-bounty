import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a dashboard",
  description: "Create a reporting dashboard for clients.",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "cat_development",
  skills: ["react", "typescript"]
};

test("createJobSchema rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 500
  });

  assert.equal(result.success, false);
});

test("createJobSchema accepts ordered budget range", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted range when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 800,
    budgetMax: 200
  });

  assert.equal(result.success, false);
});

test("updateJobSchema accepts partial budget update when only one field is present", () => {
  const result = updateJobSchema.safeParse({
    budgetMax: 200
  });

  assert.equal(result.success, true);
});
