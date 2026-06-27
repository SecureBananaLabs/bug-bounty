import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget (budgetMax < budgetMin)", () => {
  const result = createJobSchema.safeParse({
    title: "Fix login bug",
    description: "We need to fix the login flow for unauthenticated users.",
    budgetMin: 1000,
    budgetMax: 500, // inverted — lower than budgetMin
    categoryId: "cat_123",
    skills: ["react"],
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const budgetMaxIssue = result.error.issues.find(
      (issue) => issue.path[0] === "budgetMax"
    );
    assert.ok(budgetMaxIssue, "Expected a validation issue on budgetMax");
    assert.match(
      budgetMaxIssue.message,
      /budgetMax must be greater than or equal to budgetMin/i
    );
  }
});

test("createJobSchema accepts valid budget (budgetMax >= budgetMin)", () => {
  const result = createJobSchema.safeParse({
    title: "Fix login bug",
    description: "We need to fix the login flow for unauthenticated users.",
    budgetMin: 500,
    budgetMax: 1000,
    categoryId: "cat_123",
    skills: ["react"],
  });

  assert.equal(result.success, true);
});

test("createJobSchema accepts equal budget values (budgetMin === budgetMax)", () => {
  const result = createJobSchema.safeParse({
    title: "Fix login bug",
    description: "We need to fix the login flow for unauthenticated users.",
    budgetMin: 750,
    budgetMax: 750,
    categoryId: "cat_123",
    skills: ["react"],
  });

  assert.equal(result.success, true);
});