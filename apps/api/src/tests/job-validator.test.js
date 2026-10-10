import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("createJobSchema rejects budgetMax < budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a full-stack developer for a landing page.",
    budgetMin: 5000,
    budgetMax: 100,
    categoryId: "cat-1",
    skills: ["React"]
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((iss) => iss.path.includes("budgetMax")));
});

test("createJobSchema accepts budgetMax === budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a full-stack developer for a landing page.",
    budgetMin: 2000,
    budgetMax: 2000,
    categoryId: "cat-1",
    skills: ["React"]
  });

  assert.equal(result.success, true);
});

test("createJobSchema accepts budgetMax > budgetMin", () => {
  const result = createJobSchema.safeParse({
    title: "Build a website",
    description: "Need a full-stack developer for a landing page.",
    budgetMin: 1000,
    budgetMax: 5000,
    categoryId: "cat-1",
    skills: ["React"]
  });

  assert.equal(result.success, true);
});
