import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for launch.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

test("createJobSchema rejects budget ranges where max is less than min", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
});

test("updateJobSchema accepts single budget field partial updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
});

test("job schemas accept ordered and equal budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(
    createJobSchema.safeParse({
      ...validJob,
      budgetMin: 500,
      budgetMax: 500
    }).success,
    true
  );
  assert.equal(updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 500 }).success, true);
});
