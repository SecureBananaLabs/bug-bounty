import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a website",
  description: "Need a full-stack developer for a React project",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat-1",
  skills: ["react", "node"]
};

test("createJobSchema accepts valid budget range", () => {
  const result = createJobSchema.parse(validJob);
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("createJobSchema rejects inverted budget range", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater/
  );
});

test("createJobSchema rejects equal budget values", () => {
  const result = createJobSchema.parse({ ...validJob, budgetMin: 200, budgetMax: 200 });
  assert.equal(result.budgetMin, 200);
  assert.equal(result.budgetMax, 200);
});

test("updateJobSchema accepts partial payload with only budgetMin", () => {
  const result = updateJobSchema.parse({ budgetMin: 100 });
  assert.equal(result.budgetMin, 100);
});

test("updateJobSchema accepts partial payload with only budgetMax", () => {
  const result = updateJobSchema.parse({ budgetMax: 500 });
  assert.equal(result.budgetMax, 500);
});

test("updateJobSchema rejects inverted budget range when both present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater/
  );
});

test("updateJobSchema accepts valid budget range when both present", () => {
  const result = updateJobSchema.parse({ budgetMin: 100, budgetMax: 500 });
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test("updateJobSchema empty payload does not throw", () => {
  const result = updateJobSchema.parse({});
  assert.deepEqual(result, {});
});
