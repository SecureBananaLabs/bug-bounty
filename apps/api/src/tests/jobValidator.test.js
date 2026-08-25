import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema validates budget ranges", () => {
  // Valid equal
  const valid1 = createJobSchema.safeParse({
    title: "Valid job",
    description: "Valid description",
    budgetMin: 500,
    budgetMax: 500,
    categoryId: "c1",
    skills: ["s1"]
  });
  assert.equal(valid1.success, true);

  // Valid ordered
  const valid2 = createJobSchema.safeParse({
    title: "Valid job",
    description: "Valid description",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "c1",
    skills: ["s1"]
  });
  assert.equal(valid2.success, true);

  // Invalid inverted
  const invalid = createJobSchema.safeParse({
    title: "Valid job",
    description: "Valid description",
    budgetMin: 500,
    budgetMax: 100,
    categoryId: "c1",
    skills: ["s1"]
  });
  assert.equal(invalid.success, false);
});

test("updateJobSchema validates budget ranges", () => {
  // Valid partial - only one budget field
  const valid1 = updateJobSchema.safeParse({
    budgetMin: 500
  });
  assert.equal(valid1.success, true);

  // Valid partial - both fields ordered
  const valid2 = updateJobSchema.safeParse({
    budgetMin: 100,
    budgetMax: 500
  });
  assert.equal(valid2.success, true);

  // Invalid partial - inverted fields
  const invalid = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });
  assert.equal(invalid.success, false);
});
