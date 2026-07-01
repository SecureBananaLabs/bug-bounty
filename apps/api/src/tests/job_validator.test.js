import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("Job validator schema budget validation tests", async (t) => {
  const validBasePayload = {
    title: "Expert Developer Needed",
    description: "Looking for an expert React developer to build custom components.",
    budgetMin: 50,
    budgetMax: 150,
    categoryId: "tech-development",
    skills: ["React", "TypeScript"]
  };

  await t.test("createJobSchema accepts valid budget ranges", () => {
    // Standard min < max
    const result = createJobSchema.safeParse(validBasePayload);
    assert.equal(result.success, true);

    // Equal min and max values
    const equalBudgetPayload = { ...validBasePayload, budgetMin: 100, budgetMax: 100 };
    const equalResult = createJobSchema.safeParse(equalBudgetPayload);
    assert.equal(equalResult.success, true);
  });

  await t.test("createJobSchema rejects inverted budget ranges (budgetMin > budgetMax)", () => {
    const invalidPayload = { ...validBasePayload, budgetMin: 200, budgetMax: 100 };
    const result = createJobSchema.safeParse(invalidPayload);
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "budgetMin must be less than or equal to budgetMax");
    assert.deepEqual(result.error.issues[0].path, ["budgetMin"]);
  });

  await t.test("updateJobSchema accepts valid partial changes", () => {
    // Only one parameter updated
    const singleUpdateResult = updateJobSchema.safeParse({ budgetMin: 60 });
    assert.equal(singleUpdateResult.success, true);

    // Both updated, valid range
    const validUpdateResult = updateJobSchema.safeParse({ budgetMin: 60, budgetMax: 100 });
    assert.equal(validUpdateResult.success, true);
  });

  await t.test("updateJobSchema rejects inverted budget ranges when both are present", () => {
    const invalidUpdateResult = updateJobSchema.safeParse({ budgetMin: 120, budgetMax: 100 });
    assert.equal(invalidUpdateResult.success, false);
    assert.equal(invalidUpdateResult.error.issues[0].message, "budgetMin must be less than or equal to budgetMax");
    assert.deepEqual(invalidUpdateResult.error.issues[0].path, ["budgetMin"]);
  });
});
