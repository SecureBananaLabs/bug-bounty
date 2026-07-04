import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("Job Budget Validation Schema", async (t) => {
  await t.test("createJobSchema accepts valid ordered budgets", () => {
    const result = createJobSchema.safeParse({
      title: "Senior Fullstack Engineer",
      description: "Looking for an expert developer.",
      budgetMin: 50,
      budgetMax: 100,
      categoryId: "cat_1",
      skills: ["React"]
    });
    assert.equal(result.success, true);
  });

  await t.test("createJobSchema accepts equal budgets", () => {
    const result = createJobSchema.safeParse({
      title: "Senior Fullstack Engineer",
      description: "Looking for an expert developer.",
      budgetMin: 100,
      budgetMax: 100,
      categoryId: "cat_1",
      skills: ["React"]
    });
    assert.equal(result.success, true);
  });

  await t.test("createJobSchema rejects inverted budgets", () => {
    const result = createJobSchema.safeParse({
      title: "Senior Fullstack Engineer",
      description: "Looking for an expert developer.",
      budgetMin: 100,
      budgetMax: 50,
      categoryId: "cat_1",
      skills: ["React"]
    });
    assert.equal(result.success, false);
  });

  await t.test("updateJobSchema rejects inverted budget updates", () => {
    const result = updateJobSchema.safeParse({
      budgetMin: 100,
      budgetMax: 50
    });
    assert.equal(result.success, false);
  });

  await t.test("updateJobSchema accepts partial budget updates", () => {
    const resultMin = updateJobSchema.safeParse({
      budgetMin: 100
    });
    assert.equal(resultMin.success, true);

    const resultMax = updateJobSchema.safeParse({
      budgetMax: 50
    });
    assert.equal(resultMax.success, true);
  });
});
