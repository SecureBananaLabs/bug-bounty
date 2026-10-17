import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema rejects whitespace-only text fields", () => {
  const result = createJobSchema.safeParse({
    title: "    ",
    description: "          ",
    budgetMin: 10,
    budgetMax: 20,
    categoryId: "   ",
    skills: ["   "]
  });

  assert.equal(result.success, false);
});

test("createJobSchema trims accepted text fields", () => {
  const result = createJobSchema.parse({
    title: "  Build app  ",
    description: "  Build a production app  ",
    budgetMin: 10,
    budgetMax: 20,
    categoryId: "  web  ",
    skills: ["  React  ", " TypeScript "]
  });

  assert.equal(result.title, "Build app");
  assert.equal(result.description, "Build a production app");
  assert.equal(result.categoryId, "web");
  assert.deepEqual(result.skills, ["React", "TypeScript"]);
});
