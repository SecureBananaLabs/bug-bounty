import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a dashboard",
  description: "Create a useful dashboard for clients",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "development",
  skills: ["react"]
};

test("createJobSchema accepts an ordered budget range", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues.map((issue) => issue.path), [["budgetMax"]]);
});

test("updateJobSchema rejects an inverted budget range when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
});

test("updateJobSchema accepts partial budget updates with a single field", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 500 }).success, true);
});
