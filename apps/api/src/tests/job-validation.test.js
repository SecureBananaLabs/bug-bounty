import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API integration",
  description: "Create a production API integration.",
  budgetMin: 100,
  budgetMax: 250,
  categoryId: "development",
  skills: ["node"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 500,
    budgetMax: 250
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join(".") === "budgetMax"));
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});
