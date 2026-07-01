import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API integration",
  description: "Create a production-ready API integration.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "engineering",
  skills: ["node"],
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1500,
    budgetMax: 500,
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 900,
    budgetMax: 100,
  });

  assert.equal(result.success, false);
});

test("job budget schemas accept ordered ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 500 }).success, true);
});
