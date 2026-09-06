import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a portfolio site built from scratch",
    budgetMin: 500,
    budgetMax: 200,
    categoryId: "web-dev"
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find(i => i.path.includes("budgetMin"));
  assert.ok(issue, "should have budgetMin validation error");
});

test("createJobSchema accepts valid budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a portfolio site built from scratch",
    budgetMin: 200,
    budgetMax: 500,
    categoryId: "web-dev"
  });
  assert.equal(result.success, true);
});

test("createJobSchema accepts equal budget values", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a portfolio site built from scratch",
    budgetMin: 300,
    budgetMax: 300,
    categoryId: "web-dev"
  });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted budget when both provided", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 500
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find(i => i.path.includes("budgetMin"));
  assert.ok(issue, "should have budgetMin validation error");
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500
  });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const result = updateJobSchema.safeParse({
    budgetMax: 1000
  });
  assert.equal(result.success, true);
});
