import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build marketplace dashboard",
  description: "Create a client-facing dashboard for project tracking.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "cat_development",
  skills: ["React"]
};

test("create job schema rejects inverted budget ranges", () => {
  const parsed = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1500,
    budgetMax: 500
  });

  assert.equal(parsed.success, false);
  assert.equal(parsed.error.issues[0].path.join("."), "budgetMax");
});

test("create job schema accepts ordered budget ranges", () => {
  const parsed = createJobSchema.safeParse(validJob);

  assert.equal(parsed.success, true);
});

test("update job schema validates range only when both budget fields are present", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 1000 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 1000, budgetMax: 200 }).success, false);
});
