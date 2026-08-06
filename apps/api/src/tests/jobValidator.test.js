import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build an API",
  description: "Create a reliable project API",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "development"
};

test("create job validation accepts ordered and equal budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(
    createJobSchema.safeParse({ ...validJob, budgetMax: validJob.budgetMin }).success,
    true
  );
});

test("create job validation rejects an inverted budget range", () => {
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

test("partial job validation rejects an inverted range when both values are present", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("partial job validation accepts either budget value by itself", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
});
