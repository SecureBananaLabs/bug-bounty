import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget when budgetMax < budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A valid test job description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat_123",
  });

  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((i) => i.path.includes("budgetMax")),
    "expected error on budgetMax path"
  );
});

test("createJobSchema accepts valid budget when budgetMax > budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A valid test job description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_123",
  });

  assert.equal(result.success, true);
});

test("createJobSchema accepts equal budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A valid test job description",
    budgetMin: 250,
    budgetMax: 250,
    categoryId: "cat_123",
  });

  assert.equal(result.success, true);
});
