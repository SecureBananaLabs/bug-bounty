import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build API",
  description: "Build a secure API endpoint",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "backend",
  skills: ["node"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJobPayload);

  assert.equal(result.success, true);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema accepts partial budget updates", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500
  });

  assert.equal(result.success, true);
});
