import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

// ─── createJobSchema ───

test("createJobSchema accepts valid budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a modern landing page with responsive design",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "web-development",
    skills: ["react", "css"],
  });
  assert.equal(result.success, true);
  assert.equal(result.data.budgetMin, 100);
  assert.equal(result.data.budgetMax, 500);
});

test("createJobSchema accepts equal budget min and max", () => {
  const result = createJobSchema.safeParse({
    title: "Fixed price job",
    description: "This is a fixed price job posting example",
    budgetMin: 200,
    budgetMax: 200,
    categoryId: "design",
  });
  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Bad job",
    description: "This job has inverted budget range values",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "dev",
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.includes("budgetMax")));
});

test("createJobSchema rejects negative budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Negative min",
    description: "Testing negative budget minimum value here",
    budgetMin: -10,
    budgetMax: 100,
    categoryId: "dev",
  });
  assert.equal(result.success, false);
});

test("createJobSchema rejects NaN budgetMax", () => {
  const result = createJobSchema.safeParse({
    title: "NaN test",
    description: "Testing NaN budget maximum value in this test",
    budgetMin: 100,
    budgetMax: NaN,
    categoryId: "dev",
  });
  assert.equal(result.success, false);
});

test("createJobSchema rejects Infinity budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Infinity test",
    description: "Testing infinity budget minimum value here",
    budgetMin: Infinity,
    budgetMax: 500,
    categoryId: "dev",
  });
  assert.equal(result.success, false);
});

test("createJobSchema rejects missing title", () => {
  const result = createJobSchema.safeParse({
    description: "No title provided for this job posting",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "dev",
  });
  assert.equal(result.success, false);
});

test("createJobSchema rejects title too short", () => {
  const result = createJobSchema.safeParse({
    title: "Hi",
    description: "This description is long enough to pass validation",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "dev",
  });
  assert.equal(result.success, false);
});

test("createJobSchema defaults skills to empty array", () => {
  const result = createJobSchema.safeParse({
    title: "No skills job",
    description: "This job posting has no skills specified at all here",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "dev",
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.data.skills, []);
});

test("createJobSchema rejects empty skill string", () => {
  const result = createJobSchema.safeParse({
    title: "Empty skill",
    description: "This job has an empty string in skills array field",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "dev",
    skills: ["react", ""],
  });
  assert.equal(result.success, false);
});

// ─── updateJobSchema ───

test("updateJobSchema accepts partial update with only title", () => {
  const result = updateJobSchema.safeParse({ title: "New Title" });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with valid budget range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 200,
    budgetMax: 800,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted budget range when both present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100,
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.includes("budgetMax")));
});

test("updateJobSchema accepts update with only budgetMin", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 300 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts update with only budgetMax", () => {
  const result = updateJobSchema.safeParse({ budgetMax: 900 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts empty object (no-op update)", () => {
  const result = updateJobSchema.safeParse({});
  assert.equal(result.success, true);
});

test("updateJobSchema accepts equal budget values", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 250,
    budgetMax: 250,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects negative budgetMin in partial update", () => {
  const result = updateJobSchema.safeParse({ budgetMin: -50 });
  assert.equal(result.success, false);
});
