import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("job creation rejects inverted budget ranges", () => {
  const valid = createJobSchema.parse({
    title: "Build landing page",
    description: "Need a landing page for the new product launch",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "cat_1",
    skills: ["react"]
  });

  assert.equal(valid.budgetMin, 100);
  assert.equal(valid.budgetMax, 250);
  assert.throws(() => createJobSchema.parse({
    title: "Build landing page",
    description: "Need a landing page for the new product launch",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat_1",
    skills: ["react"]
  }));
});
