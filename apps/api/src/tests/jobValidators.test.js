import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Build landing page",
  description: "Create a clean landing page for a client project.",
  budgetMin: 50,
  budgetMax: 100,
  categoryId: "web",
  skills: ["react"]
};

test("createJobSchema accepts a normal budget range", () => {
  const payload = createJobSchema.parse(validJobPayload);

  assert.equal(payload.budgetMin, 50);
  assert.equal(payload.budgetMax, 100);
});

test("createJobSchema rejects an inverted budget range", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJobPayload, budgetMin: 100, budgetMax: 50 }),
    /budgetMin must be less than or equal to budgetMax/
  );
});

test("updateJobSchema rejects an inverted budget range when both fields are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 100, budgetMax: 50 }),
    /budgetMin must be less than or equal to budgetMax/
  );
});

test("updateJobSchema allows partial budget updates", () => {
  const payload = updateJobSchema.parse({ budgetMin: 100 });

  assert.deepEqual(payload, { budgetMin: 100 });
});
