import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCreateJob, validateUpdateJob } from "./job.js";

describe("Job Budget Inversion Validation (#11683)", () => {
  it("rejects job creation with inverted budgetMax < budgetMin", () => {
    const res = validateCreateJob({
      title: "Backend Engineer",
      description: "Build high-throughput REST APIs and microservices",
      budgetMin: 500,
      budgetMax: 100,
      categoryId: "cat_engineering"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "budgetMax must be greater than or equal to budgetMin");
  });

  it("accepts job creation with valid budgetMax >= budgetMin", () => {
    const res = validateCreateJob({
      title: "Backend Engineer",
      description: "Build high-throughput REST APIs and microservices",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_engineering"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.budgetMin, 100);
    assert.equal(res.data.budgetMax, 500);
  });

  it("rejects partial job update when both fields present and inverted", () => {
    const res = validateUpdateJob({ budgetMin: 800, budgetMax: 200 });
    assert.equal(res.ok, false);
    assert.equal(res.error, "budgetMax must be greater than or equal to budgetMin");
  });

  it("accepts valid partial job update", () => {
    const res = validateUpdateJob({ budgetMin: 200, budgetMax: 800 });
    assert.equal(res.ok, true);
  });
});
