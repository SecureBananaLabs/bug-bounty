import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    title: "Data Cleaning",
    description: "Need help cleaning a messy dataset for reporting.",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "data"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "budgetMax");
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});
