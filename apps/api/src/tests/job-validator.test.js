import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build a production API",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "backend",
  skills: ["node"]
};

test("createJobSchema accepts ordered budget ranges", () => {
  assert.equal(createJobSchema.parse(validJob).budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(() => createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 100 }), /budgetMax/);
});

test("updateJobSchema rejects inverted ranges when both values are present", () => {
  assert.throws(() => updateJobSchema.parse({ budgetMin: 900, budgetMax: 300 }), /budgetMax/);
});

test("updateJobSchema allows partial budget updates", () => {
  assert.equal(updateJobSchema.parse({ budgetMax: 300 }).budgetMax, 300);
});
