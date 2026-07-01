import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for a freelance client",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["nextjs"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /budgetMax/i);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /budgetMax/i);
});

test("job schemas accept ordered budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(
    updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 500 }).success,
    true
  );
});
