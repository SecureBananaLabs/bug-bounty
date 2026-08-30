import assert from "node:assert/strict";
import test from "node:test";

import { createJobSchema } from "../validators/job.js";

const baseJob = {
  title: "Build feature",
  description: "Implement the requested feature",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "development",
  skills: ["javascript"]
};

test("createJobSchema rejects whitespace-only text fields", () => {
  for (const payload of [
    { ...baseJob, title: "    " },
    { ...baseJob, description: "          " },
    { ...baseJob, categoryId: "   " },
    { ...baseJob, skills: ["   "] }
  ]) {
    assert.equal(createJobSchema.safeParse(payload).success, false);
  }
});

test("createJobSchema trims valid text values", () => {
  const parsed = createJobSchema.parse({
    ...baseJob,
    title: "  Build feature  ",
    description: "  Implement the requested feature  ",
    categoryId: "  development  ",
    skills: ["  javascript  ", "  node  "]
  });

  assert.equal(parsed.title, "Build feature");
  assert.equal(parsed.description, "Implement the requested feature");
  assert.equal(parsed.categoryId, "development");
  assert.deepEqual(parsed.skills, ["javascript", "node"]);
});

test("createJobSchema preserves existing budget validation", () => {
  assert.equal(createJobSchema.safeParse({ ...baseJob, budgetMin: -1 }).success, false);
  assert.equal(createJobSchema.safeParse({ ...baseJob, budgetMax: -1 }).success, false);
});
