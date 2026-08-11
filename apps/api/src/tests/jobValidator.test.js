import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build landing page",
  description: "Create a polished landing page for a freelance campaign.",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "web",
  skills: ["design", "frontend"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 1000,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema rejects inverted budget ranges when both bounds are provided", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1000,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});
