import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema accepts valid budget ranges", () => {
  const result = createJobSchema.safeParse({
    title: "Senior Full Stack Engineer",
    description: "Looking for an expert with React, TypeScript and Node.",
    budgetMin: 500,
    budgetMax: 1200,
    categoryId: "cat_dev",
    skills: ["React", "Node.js"]
  });
  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Senior Full Stack Engineer",
    description: "Looking for an expert with React, TypeScript and Node.",
    budgetMin: 1200,
    budgetMax: 500,
    categoryId: "cat_dev"
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("budgetMax"));
  assert.ok(issue);
  assert.match(issue.message, /greater than or equal to budgetMin/);
});

test("updateJobSchema accepts valid partial updates", () => {
  const resultBoth = updateJobSchema.safeParse({
    budgetMin: 200,
    budgetMax: 400
  });
  assert.equal(resultBoth.success, true);

  const resultSingle = updateJobSchema.safeParse({
    budgetMax: 800
  });
  assert.equal(resultSingle.success, true);
});

test("updateJobSchema rejects inverted budget range when both present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 800,
    budgetMax: 300
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("budgetMax"));
  assert.ok(issue);
  assert.match(issue.message, /greater than or equal to budgetMin/);
});
