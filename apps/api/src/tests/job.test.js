import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema accepts valid budget range", () => {
  const data = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat-1",
    skills: ["javascript"]
  };
  assert.doesNotThrow(() => createJobSchema.parse(data));
});

test("createJobSchema rejects inverted budget range", () => {
  const data = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "cat-1",
    skills: ["javascript"]
  };
  assert.throws(() => createJobSchema.parse(data), /budgetMax must be greater than or equal to budgetMin/);
});

test("createJobSchema accepts equal budget values", () => {
  const data = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 500,
    budgetMax: 500,
    categoryId: "cat-1",
    skills: ["javascript"]
  };
  assert.doesNotThrow(() => createJobSchema.parse(data));
});

test("updateJobSchema rejects inverted budget range when both fields present", () => {
  const data = {
    budgetMin: 500,
    budgetMax: 100
  };
  assert.throws(() => updateJobSchema.parse(data), /budgetMax must be greater than or equal to budgetMin/);
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const data = {
    budgetMin: 500
  };
  assert.doesNotThrow(() => updateJobSchema.parse(data));
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const data = {
    budgetMax: 1000
  };
  assert.doesNotThrow(() => updateJobSchema.parse(data));
});
