import test from "node:test";
import assert from "node:assert/strict";

import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build a complete API endpoint",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "development",
  skills: ["node"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1200,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("createJobSchema accepts equal budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 750,
    budgetMax: 750
  });

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1200,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema allows partial budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 1200 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 500 }).success, true);
});
