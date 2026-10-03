import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build API validation",
  description: "Add robust validation for job creation payloads.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_security",
  skills: ["node"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  assert.equal(createJobSchema.parse(validJobPayload).budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJobPayload, budgetMin: 500, budgetMax: 100 }),
    (error) =>
      error.issues?.some(
        (issue) =>
          issue.path.join(".") === "budgetMax" &&
          issue.message === "budgetMax must be greater than or equal to budgetMin"
      )
  );
});

test("updateJobSchema allows a partial budget update with one side present", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 500 }), { budgetMin: 500 });
});

test("updateJobSchema rejects inverted budget ranges when both sides are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    (error) => error.issues?.some((issue) => issue.path.join(".") === "budgetMax")
  );
});
