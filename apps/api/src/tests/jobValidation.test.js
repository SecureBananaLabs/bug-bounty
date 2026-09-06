import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

// --- createJobSchema tests ---

test("createJobSchema accepts valid budget range", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A test job description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_1",
    skills: ["javascript"],
  });
  assert.equal(result.success, true);
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A test job description",
    budgetMin: 200,
    budgetMax: 200,
    categoryId: "cat_1",
    skills: [],
  });
  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range (budgetMax < budgetMin)", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A test job description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat_1",
    skills: [],
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.includes("budgetMax")));
  assert.ok(
    result.error.issues.some((i) =>
      i.message.includes("budgetMax must be greater than or equal to budgetMin")
    )
  );
});

test("createJobSchema rejects zero budgetMin with lower budgetMax", () => {
  const result = createJobSchema.safeParse({
    title: "Test Job",
    description: "A test job description",
    budgetMin: 100,
    budgetMax: 0,
    categoryId: "cat_1",
    skills: [],
  });
  assert.equal(result.success, false);
});

// --- updateJobSchema tests ---

test("updateJobSchema accepts partial update without budget fields", () => {
  const result = updateJobSchema.safeParse({
    title: "Updated Title",
  });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 200,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const result = updateJobSchema.safeParse({
    budgetMax: 500,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with valid budget range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 100,
    budgetMax: 500,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects partial update with inverted budget range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100,
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.includes("budgetMax")));
});

test("updateJobSchema accepts equal budgetMin and budgetMax in partial update", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 300,
    budgetMax: 300,
  });
  assert.equal(result.success, true);
});
