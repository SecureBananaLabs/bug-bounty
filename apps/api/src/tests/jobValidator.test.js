import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for a product launch.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "web",
  skills: ["nextjs"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const parsed = createJobSchema.parse(validJob);

  assert.equal(parsed.budgetMin, 500);
  assert.equal(parsed.budgetMax, 1200);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 1200, budgetMax: 500 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 900, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema accepts partial budget updates", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 900 }), { budgetMin: 900 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 900 }), { budgetMax: 900 });
});
