import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Test Job",
  description: "A test job description that is long enough",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_1"
};

test("createJobSchema accepts valid budget range", () => {
  const result = createJobSchema.safeParse(validJob);
  assert.ok(result.success, "Should accept valid budget range");
});

test("createJobSchema accepts equal budget min and max", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 500, budgetMax: 500 });
  assert.ok(result.success, "Should accept equal budget min and max");
});

test("createJobSchema rejects budgetMax below budgetMin", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 500, budgetMax: 100 });
  assert.ok(!result.success, "Should reject budgetMax below budgetMin");
  const issue = result.error.issues.find(i => i.path.includes("budgetMax"));
  assert.ok(issue, "Error should reference budgetMax field");
});

test("createJobSchema rejects negative budget values", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: -10 });
  assert.ok(!result.success, "Should reject negative budget values");
});

test("updateJobSchema allows partial updates", () => {
  const result = updateJobSchema.safeParse({ title: "Updated" });
  assert.ok(result.success, "Should accept partial updates");
});
