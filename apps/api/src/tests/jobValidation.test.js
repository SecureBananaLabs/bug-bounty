import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Implement the requested API feature",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "backend",
  skills: ["node"]
};

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("createJobSchema accepts equal and increasing budget ranges", () => {
  assert.equal(createJobSchema.safeParse({ ...validJob, budgetMin: 100, budgetMax: 100 }).success, true);
  assert.equal(createJobSchema.safeParse(validJob).success, true);
});

test("updateJobSchema rejects inverted bounds when both are supplied", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 900, budgetMax: 800 });
  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema preserves valid single-bound partial updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 900 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 900 }).success, true);
});
