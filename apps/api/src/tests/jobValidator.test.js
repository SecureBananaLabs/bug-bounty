import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build marketplace UI",
  description: "Create the first version of a marketplace interface.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "design",
  skills: ["figma"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJobPayload);

  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 750,
    budgetMax: 250
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema allows partial budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 750 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 750 }).success, true);
});
