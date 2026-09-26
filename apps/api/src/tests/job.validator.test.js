import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const baseJob = {
  title: "Build a landing page",
  description: "A simple static landing page with a signup form.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "design",
  skills: ["html", "css"]
};

test("createJobSchema accepts a valid job with budgetMax >= budgetMin", () => {
  const result = createJobSchema.safeParse(baseJob);
  assert.equal(result.success, true);
});

test("createJobSchema accepts budgetMax === budgetMin", () => {
  const result = createJobSchema.safeParse({ ...baseJob, budgetMin: 300, budgetMax: 300 });
  assert.equal(result.success, true);
});

test("createJobSchema rejects an inverted budget range (budgetMax < budgetMin)", () => {
  const result = createJobSchema.safeParse({ ...baseJob, budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);

  const issue = result.error.issues[0];
  assert.equal(issue.path[0], "budgetMax");
});
