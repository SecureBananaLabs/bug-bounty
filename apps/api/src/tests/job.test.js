import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API integration",
  description: "Create a production-ready API integration.",
  budgetMin: 100,
  budgetMax: 250,
  categoryId: "cat_backend",
  skills: ["node"]
};

test("createJobSchema accepts valid budget ranges", () => {
  const parsed = createJobSchema.parse(validJob);

  assert.equal(parsed.budgetMin, 100);
  assert.equal(parsed.budgetMax, 250);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema allows partial budget updates", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 300 }), { budgetMax: 300 });
});

test("updateJobSchema rejects inverted budget ranges when both ends are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 400, budgetMax: 150 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});
