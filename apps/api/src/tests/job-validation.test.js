import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a dashboard",
  description: "Create a client reporting dashboard.",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "web",
  skills: ["react"]
};

function assertBudgetRangeFailure(action) {
  assert.throws(
    action,
    (error) =>
      error.issues?.some(
        (issue) =>
          issue.path.join(".") === "budgetMax" &&
          issue.message === "budgetMax must be greater than or equal to budgetMin"
      ) === true
  );
}

test("createJobSchema accepts ordered budget ranges", () => {
  assert.equal(createJobSchema.parse(validJob).budgetMax, 1000);
  assert.equal(createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 500 }).budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assertBudgetRangeFailure(() =>
    createJobSchema.parse({
      ...validJob,
      budgetMin: 500,
      budgetMax: 100
    })
  );
});

test("updateJobSchema validates budget range only when both budget fields are present", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 500 }), { budgetMin: 500 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 100 }), { budgetMax: 100 });
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 100, budgetMax: 500 }), {
    budgetMin: 100,
    budgetMax: 500
  });

  assertBudgetRangeFailure(() =>
    updateJobSchema.parse({
      budgetMin: 500,
      budgetMax: 100
    })
  );
});
