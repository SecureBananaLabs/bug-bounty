import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build dashboard",
  description: "Create a freelancer dashboard",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat-web",
  skills: ["react"]
};

test("createJobSchema accepts equal and ascending budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(
    createJobSchema.safeParse({
      ...validJob,
      budgetMin: 250,
      budgetMax: 250
    }).success,
    true
  );
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues.map((issue) => issue.path), [["budgetMax"]]);
  assert.match(result.error.issues[0].message, /budgetMax/);
});

test("updateJobSchema only compares budget range when both values are present", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 }).success, false);
});
