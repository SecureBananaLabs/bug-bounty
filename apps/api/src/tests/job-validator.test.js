import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("job budget range must not be inverted", () => {
  const result = createJobSchema.safeParse({
    title: "Website build",
    description: "Build a landing page",
    budgetMin: 1000,
    budgetMax: 100,
    categoryId: "cat_web",
    skills: ["react"]
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "budgetMin");
});

test("job budget range accepts equal bounds", () => {
  const result = createJobSchema.safeParse({
    title: "Website build",
    description: "Build a landing page",
    budgetMin: 500,
    budgetMax: 500,
    categoryId: "cat_web"
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data.skills, []);
});
