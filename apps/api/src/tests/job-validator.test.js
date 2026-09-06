import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validPayload = {
  title: "Backend platform",
  description: "Need an engineer to harden our hiring workflow.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: " engineering ",
  skills: ["node", "testing"]
};

test("createJobSchema trims valid category ids", () => {
  const payload = createJobSchema.parse(validPayload);

  assert.equal(payload.categoryId, "engineering");
});

test("createJobSchema rejects blank category ids after trimming", () => {
  const result = createJobSchema.safeParse({
    ...validPayload,
    categoryId: "   "
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "categoryId");
});

test("createJobSchema rejects oversized category ids", () => {
  const result = createJobSchema.safeParse({
    ...validPayload,
    categoryId: "a".repeat(65)
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "categoryId");
});
