import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build a profile page",
  description: "Create the authenticated profile page experience.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJobPayload, budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("createJobSchema accepts ordered budget ranges", () => {
  assert.equal(createJobSchema.parse(validJobPayload).budgetMax, 500);
});

test("updateJobSchema rejects inverted budget ranges when both values are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema accepts partial budget updates", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 500 }), { budgetMin: 500 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 500 }), { budgetMax: 500 });
});
