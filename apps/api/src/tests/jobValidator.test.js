import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build landing page",
  description: "Create a responsive landing page for a SaaS product.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "development",
  skills: ["react"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJobPayload);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted budget ranges when both values are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema accepts partial budget updates with only one budget value", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500
  });

  assert.equal(result.success, true);
});
