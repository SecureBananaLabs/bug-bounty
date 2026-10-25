import assert from "node:assert/strict";
import test from "node:test";

import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a responsive marketing landing page",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema accepts partial budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
});
