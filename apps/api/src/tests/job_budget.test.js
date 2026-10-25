import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("job schema validates budgetMax >= budgetMin", () => {
  // 1. Inverted range rejected in createJobSchema
  const inverted = createJobSchema.safeParse({
    title: "Senior Node.js Backend Engineer",
    description: "Build robust REST APIs and auth middleware",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat_dev",
    skills: ["node", "express"]
  });

  assert.equal(inverted.success, false);
  const error = inverted.error.issues[0];
  assert.equal(error.path[0], "budgetMax");
  assert.match(error.message, /budgetMax must be greater than or equal to budgetMin/i);

  // 2. Valid range accepted in createJobSchema
  const valid = createJobSchema.safeParse({
    title: "Senior Node.js Backend Engineer",
    description: "Build robust REST APIs and auth middleware",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_dev",
    skills: ["node", "express"]
  });

  assert.equal(valid.success, true);
  assert.equal(valid.data.budgetMin, 100);
  assert.equal(valid.data.budgetMax, 500);

  // 3. Equal bounds (fixed price) accepted
  const fixedPrice = createJobSchema.safeParse({
    title: "Senior Node.js Backend Engineer",
    description: "Build robust REST APIs and auth middleware",
    budgetMin: 250,
    budgetMax: 250,
    categoryId: "cat_dev"
  });

  assert.equal(fixedPrice.success, true);
  assert.equal(fixedPrice.data.budgetMin, 250);
  assert.equal(fixedPrice.data.budgetMax, 250);

  // 4. Inverted update rejected in updateJobSchema
  const invertedUpdate = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 200
  });

  assert.equal(invertedUpdate.success, false);
  assert.match(invertedUpdate.error.issues[0].message, /budgetMax must be greater than or equal to budgetMin/i);

  // 5. Valid partial update accepted in updateJobSchema
  const validPartialUpdate = updateJobSchema.safeParse({
    budgetMin: 300
  });

  assert.equal(validPartialUpdate.success, true);
  assert.equal(validPartialUpdate.data.budgetMin, 300);
});
