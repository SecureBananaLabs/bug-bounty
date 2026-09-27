import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Landing page redesign",
  description: "Refresh the landing page for a better first impression.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "design",
  skills: ["figma"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted ranges when both budgets are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 400,
    budgetMax: 250
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema allows partial budget updates", () => {
  const result = updateJobSchema.safeParse({
    budgetMax: 250
  });

  assert.equal(result.success, true);
});
