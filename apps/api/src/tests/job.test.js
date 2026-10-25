import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

// ── createJobSchema ──────────────────────────────────────────────

test("createJobSchema accepts valid budget ranges", () => {
  const valid = {
    title: "Build a landing page",
    description: "I need a responsive landing page with 3 sections.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "web-dev",
    skills: ["react", "css"]
  };
  // Should parse without throwing
  const result = createJobSchema.parse(valid);
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const payload = {
    title: "Fix CSS bug",
    description: "One small CSS fix on the homepage.",
    budgetMin: 200,
    budgetMax: 200,
    categoryId: "css",
    skills: []
  };
  const result = createJobSchema.parse(payload);
  assert.equal(result.budgetMin, 200);
  assert.equal(result.budgetMax, 200);
});

test("createJobSchema rejects inverted budget ranges (max < min)", () => {
  const invalid = {
    title: "Build a landing page",
    description: "I need a responsive landing page with 3 sections.",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "web-dev",
    skills: []
  };
  assert.throws(
    () => createJobSchema.parse(invalid),
    (err) => {
      const issues = err.issues ?? err;
      return issues.some((i) => i.message.includes("budgetMax must be greater"));
    }
  );
});

test("createJobSchema rejects negative budgets", () => {
  const payload = {
    title: "Write unit tests",
    description: "Add unit tests for the job module.",
    budgetMin: -50,
    budgetMax: 100,
    categoryId: "testing",
    skills: []
  };
  assert.throws(() => createJobSchema.parse(payload));
});

// ── updateJobSchema (partial) ────────────────────────────────────

test("updateJobSchema accepts partial payload with only budgetMin", () => {
  const result = updateJobSchema.parse({ budgetMin: 300 });
  assert.equal(result.budgetMin, 300);
});

test("updateJobSchema accepts partial payload with only budgetMax", () => {
  const result = updateJobSchema.parse({ budgetMax: 800 });
  assert.equal(result.budgetMax, 800);
});

test("updateJobSchema rejects inverted budget ranges on partial update", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 600, budgetMax: 200 }),
    (err) => {
      const issues = err.issues ?? err;
      return issues.some((i) => i.message.includes("budgetMax must be greater"));
    }
  );
});

test("updateJobSchema accepts valid budget ranges on partial update", () => {
  const result = updateJobSchema.parse({ budgetMin: 100, budgetMax: 400 });
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 400);
});