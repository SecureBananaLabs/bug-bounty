import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema accepts valid budget range", () => {
  const data = {
    title: "Software Engineer",
    description: "Looking for an experienced engineer to build the backend.",
    budgetMin: 50,
    budgetMax: 100,
    categoryId: "tech",
    skills: ["Node.js"]
  };
  const result = createJobSchema.safeParse(data);
  assert.equal(result.success, true);
});

test("createJobSchema accepts equal min and max budget", () => {
  const data = {
    title: "Software Engineer",
    description: "Looking for an experienced engineer to build the backend.",
    budgetMin: 100,
    budgetMax: 100,
    categoryId: "tech",
    skills: ["Node.js"]
  };
  const result = createJobSchema.safeParse(data);
  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range", () => {
  const data = {
    title: "Software Engineer",
    description: "Looking for an experienced engineer to build the backend.",
    budgetMin: 100,
    budgetMax: 50,
    categoryId: "tech",
    skills: ["Node.js"]
  };
  const result = createJobSchema.safeParse(data);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].message, "budgetMax cannot be lower than budgetMin");
  }
});

test("updateJobSchema rejects inverted budget when both present", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 50 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].message, "budgetMax cannot be lower than budgetMin");
  }
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const result = updateJobSchema.safeParse({ budgetMax: 100 });
  assert.equal(result.success, true);
});
