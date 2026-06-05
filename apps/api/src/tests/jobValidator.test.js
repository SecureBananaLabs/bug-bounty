import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a dashboard",
  description: "Create a dashboard for marketplace clients.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "cat_engineering",
  skills: ["react"],
};

test("createJobSchema accepts ordered budget ranges", () => {
  const job = createJobSchema.parse(validJob);

  assert.equal(job.budgetMin, 500);
  assert.equal(job.budgetMax, 1500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 1500, budgetMax: 500 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema allows partial budget updates", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 750 }), { budgetMin: 750 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 2000 }), { budgetMax: 2000 });
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 2000, budgetMax: 750 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});
