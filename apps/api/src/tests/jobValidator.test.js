import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Landing page build",
  description: "Build a polished landing page for a new product.",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "web-development",
  skills: ["react"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJobPayload, budgetMin: 500, budgetMax: 100 }),
    (error) => error instanceof ZodError && error.issues.some((issue) => issue.path.join(".") === "budgetMax")
  );
});

test("createJobSchema accepts ordered budget ranges", () => {
  assert.equal(createJobSchema.parse(validJobPayload).budgetMax, 1000);
  assert.equal(createJobSchema.parse({ ...validJobPayload, budgetMax: 500 }).budgetMax, 500);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 750, budgetMax: 250 }),
    (error) => error instanceof ZodError && error.issues.some((issue) => issue.path.join(".") === "budgetMax")
  );
});

test("updateJobSchema allows partial budget updates with one side omitted", () => {
  assert.equal(updateJobSchema.parse({ budgetMin: 750 }).budgetMin, 750);
  assert.equal(updateJobSchema.parse({ budgetMax: 250 }).budgetMax, 250);
});
