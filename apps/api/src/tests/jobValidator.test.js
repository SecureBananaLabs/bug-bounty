import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for launch",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_design",
  skills: ["design"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
  assert.equal(
    result.error.issues[0].message,
    "budgetMax must be greater than or equal to budgetMin"
  );
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 300,
    budgetMax: 200
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema allows partial budget updates with one side omitted", () => {
  const minOnly = updateJobSchema.safeParse({ budgetMin: 300 });
  const maxOnly = updateJobSchema.safeParse({ budgetMax: 200 });

  assert.equal(minOnly.success, true);
  assert.equal(maxOnly.success, true);
});
