import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API routes",
  description: "Implement and validate the missing API routes for jobs.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_web",
  skills: ["node", "zod"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const payload = createJobSchema.parse(validJob);

  assert.equal(payload.budgetMin, 100);
  assert.equal(payload.budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema rejects inverted ranges when both values are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema still allows partial budget updates", () => {
  const payload = updateJobSchema.parse({ budgetMin: 500 });

  assert.equal(payload.budgetMin, 500);
  assert.equal(payload.budgetMax, undefined);
});
