import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const base = {
  title: "Build a landing page",
  description: "A landing page with a signup form",
  categoryId: "cat_1",
  skills: ["react"]
};

test("createJobSchema accepts an ordered budget range", () => {
  const result = createJobSchema.safeParse({ ...base, budgetMin: 100, budgetMax: 500 });
  assert.equal(result.success, true);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({ ...base, budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});

test("updateJobSchema rejects an inverted partial budget range", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 }).success, false);
  assert.equal(updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 500 }).success, true);
  assert.equal(updateJobSchema.safeParse({ title: "Short" }).success, true);
});
