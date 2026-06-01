import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for launch",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues.map((issue) => issue.path), [["budgetMax"]]);
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 250,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues.map((issue) => issue.path), [["budgetMax"]]);
});

test("updateJobSchema allows partial budget updates with one side omitted", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 250 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 250 }).success, true);
});
