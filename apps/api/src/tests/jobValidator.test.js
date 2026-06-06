import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
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
  assert.ok(
    result.error.issues.some(
      (issue) =>
        issue.path.join(".") === "budgetMax" &&
        issue.message === "budgetMax must be greater than or equal to budgetMin"
    )
  );
});

test("updateJobSchema rejects inverted budget ranges when both values are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 250,
    budgetMax: 100
  });

  assert.equal(result.success, false);
});

test("job schemas accept ordered budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 100 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 100 }).success, true);
});
