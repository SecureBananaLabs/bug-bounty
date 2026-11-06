import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const base = {
  title: "Build a dashboard",
  description: "Lay out a responsive dashboard with charts",
  categoryId: "cat_web",
  skills: ["react"]
};

test("createJobSchema accepts an ordered budget range", () => {
  const parsed = createJobSchema.parse({ ...base, budgetMin: 100, budgetMax: 500 });

  assert.equal(parsed.budgetMin, 100);
  assert.equal(parsed.budgetMax, 500);
  assert.deepEqual(parsed.skills, ["react"]);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({ ...base, budgetMin: 500, budgetMax: 100 });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});

test("updateJobSchema applies the same ordering rule to partial payloads", () => {
  const inverted = updateJobSchema.safeParse({ budgetMin: 300, budgetMax: 200 });
  assert.equal(inverted.success, false);

  const ordered = updateJobSchema.safeParse({ budgetMin: 200, budgetMax: 300 });
  assert.equal(ordered.success, true);
  assert.equal(ordered.data.budgetMax, 300);

  const singleBound = updateJobSchema.safeParse({ budgetMax: 300 });
  assert.equal(singleBound.success, true);

  const tooShort = updateJobSchema.safeParse({ title: "abc" });
  assert.equal(tooShort.success, false);
});
