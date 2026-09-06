import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Budget range guard",
  description: "Ensure the validation rejects inverted budget ranges.",
  budgetMin: 50,
  budgetMax: 100,
  categoryId: "cat-1",
  skills: ["zod"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 120,
    budgetMax: 80
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues.length, 1);
  assert.deepEqual(result.error.issues[0], {
    code: "custom",
    path: ["budgetMax"],
    message: "budgetMax must be greater than or equal to budgetMin"
  });
});

test("updateJobSchema rejects inverted budget ranges when both bounds are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 120,
    budgetMax: 80
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues.length, 1);
  assert.deepEqual(result.error.issues[0], {
    code: "custom",
    path: ["budgetMax"],
    message: "budgetMax must be greater than or equal to budgetMin"
  });
});

test("createJobSchema accepts a valid budget range", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});
