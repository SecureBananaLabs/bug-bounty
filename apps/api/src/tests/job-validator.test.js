import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build dashboard",
  description: "Create a freelancer analytics dashboard",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "analytics",
  skills: ["sql"]
};

test("createJobSchema accepts equal and ordered budget ranges", () => {
  const equalRange = createJobSchema.parse({
    ...validJob,
    budgetMax: 500
  });
  const orderedRange = createJobSchema.parse(validJob);

  assert.equal(equalRange.budgetMin, 500);
  assert.equal(equalRange.budgetMax, 500);
  assert.equal(orderedRange.budgetMax, 1000);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "budgetMax");
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "budgetMax");
});

test("updateJobSchema allows partial budget updates when only one field is present", () => {
  const minOnly = updateJobSchema.parse({ budgetMin: 500 });
  const maxOnly = updateJobSchema.parse({ budgetMax: 1000 });

  assert.deepEqual(minOnly, { budgetMin: 500 });
  assert.deepEqual(maxOnly, { budgetMax: 1000 });
});
