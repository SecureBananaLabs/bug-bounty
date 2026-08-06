import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build an AI assistant",
  description: "Create a production-ready assistant workflow.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "engineering",
  skills: ["Node.js"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
  assert.equal(result.data.budgetMin, 500);
  assert.equal(result.data.budgetMax, 1500);
});

test("updateJobSchema rejects inverted ranges when both budget fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 900,
    budgetMax: 300
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema permits single budget field partial updates", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 900 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 900 }).success, true);
});
