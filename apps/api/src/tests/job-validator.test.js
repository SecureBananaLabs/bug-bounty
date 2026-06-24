import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for a new product",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "web",
  skills: ["react"],
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 500,
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema rejects inverted budget ranges when both budgets are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 500,
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema allows partial budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 1000 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 1000 }).success, true);
});
