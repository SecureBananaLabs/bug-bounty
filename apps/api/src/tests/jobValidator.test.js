import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a responsive marketing landing page.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "cat_design",
  skills: ["design", "react"]
};

test("createJobSchema accepts equal or ascending budget ranges", () => {
  assert.equal(createJobSchema.parse(validJob).budgetMax, 1200);
  assert.equal(createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 500 }).budgetMax, 500);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 1200, budgetMax: 500 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});
