import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build a useful API endpoint",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "backend",
  skills: ["node"]
};

test("job validation rejects whitespace-only title", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    title: "    "
  });

  assert.equal(result.success, false);
});

test("job validation rejects whitespace-only description", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    description: "          "
  });

  assert.equal(result.success, false);
});

test("job validation rejects whitespace-only category id", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    categoryId: "   "
  });

  assert.equal(result.success, false);
});

test("job validation rejects whitespace-only skills", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    skills: ["node", "   "]
  });

  assert.equal(result.success, false);
});

test("job validation trims accepted string fields", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    title: "  Build API  ",
    description: "  Build a useful API endpoint  ",
    categoryId: "  backend  ",
    skills: ["  node  ", "  api  "]
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    ...validJob,
    title: "Build API",
    description: "Build a useful API endpoint",
    categoryId: "backend",
    skills: ["node", "api"]
  });
});
