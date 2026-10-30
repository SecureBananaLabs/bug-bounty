import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build webhook integration",
  description: "Implement a small webhook integration for testing.",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "cat_development",
  skills: ["node"]
};

test("createJobSchema rejects budget ranges where min exceeds max", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
  assert.equal(
    result.error.issues[0].message,
    "budgetMin must be less than or equal to budgetMax"
  );
});

test("createJobSchema accepts equal budget bounds", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 100,
    budgetMax: 100
  });

  assert.equal(result.success, true);
});

test("updateJobSchema validates provided budget ranges", () => {
  const invalidRange = updateJobSchema.safeParse({
    budgetMin: 300,
    budgetMax: 200
  });
  const partialRange = updateJobSchema.safeParse({
    budgetMin: 300
  });

  assert.equal(invalidRange.success, false);
  assert.equal(partialRange.success, true);
});
