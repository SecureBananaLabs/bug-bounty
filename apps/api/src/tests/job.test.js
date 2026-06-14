import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a website",
  description: "We need a responsive website built",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_1",
  skills: ["javascript", "react"],
};

test("createJobSchema accepts valid budget range", () => {
  const result = createJobSchema.safeParse(validJob);
  assert.equal(result.success, true);
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 300, budgetMax: 300 });
  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget range", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.message.includes("budgetMax")));
});

test("createJobSchema rejects zero budgetMax with positive budgetMin", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 100, budgetMax: 0 });
  assert.equal(result.success, false);
});

test("updateJobSchema accepts partial update with valid range", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 500 });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted range when both fields present", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
});

test("updateJobSchema accepts single budget field without the other", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100 });
  assert.equal(result.success, true);

  const result2 = updateJobSchema.safeParse({ budgetMax: 500 });
  assert.equal(result2.success, true);
});

test("createJobSchema rejects missing required fields", () => {
  const result = createJobSchema.safeParse({ title: "Hi" });
  assert.equal(result.success, false);
});
