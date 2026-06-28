import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a landing page",
  description: "Need a responsive landing page built with Next.js",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "cat-web-dev",
  skills: ["Next.js", "TailwindCSS"],
};

test("createJobSchema accepts valid job data", () => {
  const result = createJobSchema.safeParse(validJob);
  assert.equal(result.success, true);
});

test("createJobSchema rejects budgetMax < budgetMin", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 500,
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.includes("budgetMax")));
});

test("createJobSchema rejects budgetMax < budgetMin (large range)", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 50000,
    budgetMax: 100,
  });
  assert.equal(result.success, false);
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 750,
    budgetMax: 750,
  });
  assert.equal(result.success, true);
});

test("createJobSchema accepts budgetMax > budgetMin", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 100,
    budgetMax: 9999,
  });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted range when both present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 2000,
    budgetMax: 500,
  });
  assert.equal(result.success, false);
});

test("updateJobSchema accepts partial update with only budgetMin", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 300 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts partial update with only budgetMax", () => {
  const result = updateJobSchema.safeParse({ budgetMax: 3000 });
  assert.equal(result.success, true);
});

test("updateJobSchema accepts valid partial range", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 100,
    budgetMax: 500,
  });
  assert.equal(result.success, true);
});
