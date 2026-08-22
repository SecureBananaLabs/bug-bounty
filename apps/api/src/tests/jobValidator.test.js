import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Landing page audit",
  description: "Review a landing page and provide conversion notes.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "cat-growth",
  skills: ["copywriting", "ux"]
};

test("createJobSchema accepts an ordered budget range", () => {
  const parsed = createJobSchema.parse(validJob);

  assert.equal(parsed.budgetMin, 500);
  assert.equal(parsed.budgetMax, 1200);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1200,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema rejects an inverted budget range when both values are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 750,
    budgetMax: 250
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema allows single-field budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 750 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 250 }).success, true);
});
