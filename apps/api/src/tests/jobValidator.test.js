import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build landing page",
  description: "Create a polished marketing landing page.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["design", "react"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.parse(validJobPayload);

  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
  assert.equal(
    result.error.issues[0].message,
    "budgetMin must be less than or equal to budgetMax"
  );
});

test("updateJobSchema rejects inverted ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema allows partial budget updates with one side omitted", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
});
