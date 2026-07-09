import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build marketplace API",
  description: "Create the marketplace job API",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_1",
  skills: ["node"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.parse(validJob);

  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema allows partial budget updates", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 500 }), { budgetMin: 500 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 100 }), { budgetMax: 100 });
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});
