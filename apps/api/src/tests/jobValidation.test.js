import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a landing page",
  description: "Create a conversion-focused landing page.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["copywriting"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted ranges only when both budget fields are present", () => {
  const inverted = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });
  const partial = updateJobSchema.safeParse({ budgetMin: 500 });

  assert.equal(inverted.success, false);
  assert.equal(inverted.error.issues[0].path.join("."), "budgetMax");
  assert.equal(partial.success, true);
});
