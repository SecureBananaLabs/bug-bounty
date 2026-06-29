import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build checkout flow",
  description: "Create a polished checkout flow for clients.",
  budgetMin: 500,
  budgetMax: 750,
  categoryId: "web",
  skills: ["react"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 900,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "budgetMin must be less than or equal to budgetMax");
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("createJobSchema allows equal budget endpoints", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 500
  });

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted ranges only when both endpoints are present", () => {
  const inverted = updateJobSchema.safeParse({
    budgetMin: 900,
    budgetMax: 500
  });
  const partial = updateJobSchema.safeParse({
    budgetMin: 900
  });

  assert.equal(inverted.success, false);
  assert.equal(partial.success, true);
});
