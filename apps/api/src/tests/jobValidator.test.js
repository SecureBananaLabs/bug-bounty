import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Landing page build",
  description: "Build a responsive landing page",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["javascript"]
};

test("createJobSchema rejects whitespace-only job text fields", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    title: "    ",
    description: "          ",
    categoryId: "   ",
    skills: ["   "]
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error.issues.map((issue) => issue.path.join(".")),
    ["title", "description", "categoryId", "skills.0"]
  );
});

test("createJobSchema trims surrounding whitespace before returning parsed payload", () => {
  const result = createJobSchema.parse({
    ...validJob,
    title: "  Landing page build  ",
    description: "  Build a responsive landing page  ",
    categoryId: "  web  ",
    skills: ["  javascript  ", "  css  "]
  });

  assert.equal(result.title, "Landing page build");
  assert.equal(result.description, "Build a responsive landing page");
  assert.equal(result.categoryId, "web");
  assert.deepEqual(result.skills, ["javascript", "css"]);
});

test("updateJobSchema rejects whitespace-only fields while still allowing partial updates", () => {
  assert.equal(updateJobSchema.safeParse({ title: "    " }).success, false);
  assert.deepEqual(updateJobSchema.parse({ skills: ["  node  "] }), {
    skills: ["node"]
  });
});
