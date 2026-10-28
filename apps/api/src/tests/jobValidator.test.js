import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a landing page",
  description: "Create a polished landing page for a marketplace",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_web",
  skills: ["react"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});
