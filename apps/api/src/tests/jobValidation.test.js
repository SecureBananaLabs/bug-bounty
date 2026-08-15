import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a marketplace API",
  description: "Create backend endpoints for the marketplace",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "development",
  skills: ["node"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("createJobSchema accepts ordered budget ranges", () => {
  const payload = createJobSchema.parse(validJob);

  assert.equal(payload.budgetMin, 100);
  assert.equal(payload.budgetMax, 500);
});

test("updateJobSchema rejects inverted budget ranges when both budgets are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema permits partial budget updates", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 250 }), { budgetMin: 250 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 750 }), { budgetMax: 750 });
});
