import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Backend API role",
  description: "Need a careful validator fix.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_backend",
  skills: ["node", "testing"]
};

test("createJobSchema accepts valid ordered budget ranges", () => {
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
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
  assert.match(result.error.issues[0].message, /greater than or equal to/);
});

test("createJobSchema accepts equal minimum and maximum budgets", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 250,
    budgetMax: 250
  });

  assert.equal(result.success, true);
});

test("updateJobSchema rejects partial inverted budget ranges when both values are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 900,
    budgetMax: 200
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});
