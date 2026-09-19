import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for a client project.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: " web-design ",
  skills: ["design"]
};

test("createJobSchema trims category ids before storage", () => {
  const payload = createJobSchema.parse(validJob);

  assert.equal(payload.categoryId, "web-design");
});

test("createJobSchema rejects blank and oversized category ids", () => {
  assert.throws(() => createJobSchema.parse({ ...validJob, categoryId: "   " }));
  assert.throws(() => createJobSchema.parse({ ...validJob, categoryId: "a".repeat(81) }));
});

test("updateJobSchema normalizes category ids when present", () => {
  assert.equal(updateJobSchema.parse({ categoryId: " analytics " }).categoryId, "analytics");
  assert.throws(() => updateJobSchema.parse({ categoryId: "   " }));
});
