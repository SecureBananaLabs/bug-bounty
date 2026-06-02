import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a dashboard",
  description: "Create a useful analytics dashboard",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "development",
  skills: ["javascript"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
  assert.equal(result.data.budgetMin, 100);
  assert.equal(result.data.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
  assert.equal(
    result.error.issues[0].message,
    "budgetMax must be greater than or equal to budgetMin"
  );
});

test("updateJobSchema rejects inverted budget ranges when both bounds are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 800,
    budgetMax: 300
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema accepts partial budget updates with one bound", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 800 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 300 }).success, true);
});
