import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build onboarding flow",
  description: "Create the first version of an onboarding flow.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "design",
  skills: ["ux"]
};

test("createJobSchema accepts an ordered budget range", () => {
  assert.equal(createJobSchema.parse(validJob).budgetMax, 1200);
});

test("createJobSchema rejects an inverted budget range", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 1200, budgetMax: 500 }),
    (error) =>
      error instanceof ZodError &&
      error.issues.some(
        (issue) =>
          issue.path.join(".") === "budgetMax" &&
          issue.message === "budgetMax must be greater than or equal to budgetMin"
      )
  );
});
