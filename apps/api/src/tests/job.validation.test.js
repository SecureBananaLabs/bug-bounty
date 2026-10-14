import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Backend API work",
  description: "Implement ordered budget validation coverage.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "backend",
  skills: ["node", "zod"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const parsed = createJobSchema.parse(validJob);

  assert.equal(parsed.budgetMin, 100);
  assert.equal(parsed.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () =>
      createJobSchema.parse({
        ...validJob,
        budgetMin: 500,
        budgetMax: 100
      }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  assert.throws(
    () =>
      updateJobSchema.parse({
        budgetMin: 750,
        budgetMax: 250
      }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema allows partial updates without both budget fields", () => {
  const parsed = updateJobSchema.parse({ budgetMin: 250 });

  assert.equal(parsed.budgetMin, 250);
  assert.equal(parsed.budgetMax, undefined);
});
