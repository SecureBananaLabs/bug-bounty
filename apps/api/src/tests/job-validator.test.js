import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build profile search",
  description: "Create searchable freelancer profile listings.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "engineering",
  skills: ["node"]
};

test("createJobSchema accepts an ordered budget range", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema rejects inverted ranges only when both bounds are present", () => {
  const inverted = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });
  const partialMin = updateJobSchema.safeParse({ budgetMin: 500 });
  const partialMax = updateJobSchema.safeParse({ budgetMax: 100 });

  assert.equal(inverted.success, false);
  assert.equal(inverted.error.issues[0].path.join("."), "budgetMax");
  assert.equal(partialMin.success, true);
  assert.equal(partialMax.success, true);
});
