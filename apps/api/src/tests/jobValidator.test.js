import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a REST API",
  description: "Create a full REST API with authentication and CRUD",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "tech",
  skills: ["nodejs", "typescript"],
};

// --- createJobSchema ---

test("createJobSchema: accepts valid job with budgetMax >= budgetMin", () => {
  const result = createJobSchema.safeParse(validJob);
  assert.equal(result.success, true);
});

test("createJobSchema: accepts equal budgetMin and budgetMax", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 500, budgetMax: 500 });
  assert.equal(result.success, true);
});

test("createJobSchema: rejects inverted budget range (budgetMax < budgetMin)", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 1000, budgetMax: 500 });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.message.includes("budgetMax")));
});

test("createJobSchema: rejects when budgetMax is zero but budgetMin is positive", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 100, budgetMax: 0 });
  assert.equal(result.success, false);
});

test("createJobSchema: rejects missing required fields", () => {
  const result = createJobSchema.safeParse({ title: "Hi" });
  assert.equal(result.success, false);
});

// --- updateJobSchema ---

test("updateJobSchema: accepts partial update with only title", () => {
  const result = updateJobSchema.safeParse({ title: "Updated title" });
  assert.equal(result.success, true);
});

test("updateJobSchema: accepts valid budget range in partial update", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 200 });
  assert.equal(result.success, true);
});

test("updateJobSchema: rejects inverted budget range when both fields present", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.message.includes("budgetMax")));
});

test("updateJobSchema: allows only budgetMin without budgetMax (no comparison needed)", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 200 });
  assert.equal(result.success, true);
});

test("updateJobSchema: allows only budgetMax without budgetMin (no comparison needed)", () => {
  const result = updateJobSchema.safeParse({ budgetMax: 800 });
  assert.equal(result.success, true);
});
