import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build dashboard",
  description: "Create a useful reporting dashboard.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_web"
};

test("createJobSchema trims category ids", () => {
  const parsed = createJobSchema.parse({
    ...validJob,
    categoryId: "  cat_frontend  "
  });

  assert.equal(parsed.categoryId, "cat_frontend");
});

test("createJobSchema rejects blank category ids after trimming", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, categoryId: "   " }),
    ZodError
  );
});

test("createJobSchema rejects oversized category ids", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, categoryId: "c".repeat(65) }),
    ZodError
  );
});
