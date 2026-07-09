import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validCreatePayload = {
  title: "Build landing page",
  description: "Create a conversion-focused landing page.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["copywriting", "html"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validCreatePayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues.map((issue) => issue.path), [["budgetMax"]]);
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validCreatePayload);

  assert.equal(result.success, true);
  assert.equal(result.data.budgetMin, 100);
  assert.equal(result.data.budgetMax, 500);
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 300,
    budgetMax: 299
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues.map((issue) => issue.path), [["budgetMax"]]);
});

test("updateJobSchema allows partial budget updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 300 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 500 }).success, true);
});
