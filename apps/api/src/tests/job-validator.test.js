import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validPayload = {
  title: "Backend platform",
  description: "Need an engineer to harden our hiring workflow.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "engineering",
  skills: ["node", "testing"]
};

test("createJobSchema accepts matching budget ranges", () => {
  const payload = createJobSchema.parse(validPayload);

  assert.deepEqual(payload, validPayload);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validPayload,
    budgetMin: 1000,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues, [
    {
      code: "custom",
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"]
    }
  ]);
});
