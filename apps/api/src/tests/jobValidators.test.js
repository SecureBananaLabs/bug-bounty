import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

function basePayload(extra) {
  return {
    title: "Build a landing page",
    description: "A short landing page for a bakery.",
    budgetMin: 400,
    budgetMax: 900,
    categoryId: "cat_web",
    ...extra
  };
}

test("createJobSchema accepts an ordered budget range", () => {
  const result = createJobSchema.safeParse(basePayload());
  assert.equal(result.success, true);
  assert.deepEqual(result.data.skills, []);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse(basePayload({ budgetMax: 100 }));
  assert.equal(result.success, false);
  const [issue] = result.error.issues;
  assert.deepEqual(issue.path, ["budgetMax"]);
  assert.match(issue.message, /budgetMax must be greater than or equal to budgetMin/);
});

test("updateJobSchema rejects an inverted budget range", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 200 });
  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema keeps partial updates with a single bound", () => {
  const minOnly = updateJobSchema.safeParse({ budgetMin: 500 });
  assert.equal(minOnly.success, true);

  const maxOnly = updateJobSchema.safeParse({ budgetMax: 500 });
  assert.equal(maxOnly.success, true);
});

test("updateJobSchema accepts an ordered partial budget range", () => {
  const result = updateJobSchema.safeParse({ budgetMin: 100, budgetMax: 500 });
  assert.equal(result.success, true);
});
