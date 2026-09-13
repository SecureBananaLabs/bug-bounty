import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build a small API endpoint",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_backend",
  skills: ["node"]
};

describe("job validation", () => {
  it("accepts ordered budget ranges on job creation", () => {
    const result = createJobSchema.safeParse(validJob);

    assert.equal(result.success, true);
  });

  it("rejects inverted budget ranges on job creation", () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: 500,
      budgetMax: 100
    });

    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].path.join("."), "budgetMax");
  });

  it("rejects inverted budget ranges on partial updates when both fields are present", () => {
    const result = updateJobSchema.safeParse({
      budgetMin: 500,
      budgetMax: 100
    });

    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].path.join("."), "budgetMax");
  });

  it("allows partial updates with only one budget field", () => {
    assert.equal(updateJobSchema.safeParse({ budgetMin: 500 }).success, true);
    assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
  });
});
