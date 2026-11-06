import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a focused marketing landing page.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "frontend",
  skills: ["react"]
};

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

test("createJobSchema accepts equal and ascending budget ranges", () => {
  assert.equal(
    createJobSchema.safeParse({
      ...validJob,
      budgetMin: 500,
      budgetMax: 500
    }).success,
    true
  );

  assert.equal(createJobSchema.safeParse(validJob).success, true);
});

test("updateJobSchema validates budget range only when both bounds are provided", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);

  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});
