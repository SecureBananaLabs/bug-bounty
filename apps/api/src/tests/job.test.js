import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

test("createJobSchema rejects inverted budget ranges (budgetMax < budgetMin)", () => {
  const payload = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 1000,
    budgetMax: 500,
    categoryId: "cat_1",
    skills: []
  };

  assert.throws(
    () => createJobSchema.parse(payload),
    (error) => {
      return error.errors.some(
        (e) => e.path.includes("budgetMax") && e.message.includes("budgetMax must be greater than or equal to budgetMin")
      );
    },
    "Should reject when budgetMax is less than budgetMin"
  );
});

test("createJobSchema accepts valid budget ranges (budgetMax >= budgetMin)", () => {
  const payload = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 500,
    budgetMax: 1000,
    categoryId: "cat_1",
    skills: []
  };

  const result = createJobSchema.parse(payload);
  assert.equal(result.budgetMin, 500);
  assert.equal(result.budgetMax, 1000);
});

test("createJobSchema accepts equal budgetMin and budgetMax", () => {
  const payload = {
    title: "Test Job",
    description: "This is a test job description",
    budgetMin: 1000,
    budgetMax: 1000,
    categoryId: "cat_1",
    skills: []
  };

  const result = createJobSchema.parse(payload);
  assert.equal(result.budgetMin, 1000);
  assert.equal(result.budgetMax, 1000);
});

test("updateJobSchema rejects inverted budget ranges when both are present", () => {
  const payload = {
    budgetMin: 1000,
    budgetMax: 500
  };

  assert.throws(
    () => updateJobSchema.parse(payload),
    (error) => {
      return error.errors.some(
        (e) => e.path.includes("budgetMax") && e.message.includes("budgetMax must be greater than or equal to budgetMin")
      );
    },
    "Should reject when updating with inverted budget ranges"
  );
});

test("updateJobSchema accepts valid budget ranges", () => {
  const payload = {
    budgetMin: 500,
    budgetMax: 1000
  };

  const result = updateJobSchema.parse(payload);
  assert.equal(result.budgetMin, 500);
  assert.equal(result.budgetMax, 1000);
});

test("updateJobSchema accepts single budget field", () => {
  const payloadOnlyMin = {
    budgetMin: 500
  };

  const resultMin = updateJobSchema.parse(payloadOnlyMin);
  assert.equal(resultMin.budgetMin, 500);
  assert.ok(!("budgetMax" in resultMin));

  const payloadOnlyMax = {
    budgetMax: 1000
  };

  const resultMax = updateJobSchema.parse(payloadOnlyMax);
  assert.equal(resultMax.budgetMax, 1000);
  assert.ok(!("budgetMin" in resultMax));
});
