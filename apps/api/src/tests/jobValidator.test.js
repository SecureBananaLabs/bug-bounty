import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build search filters",
  description: "Add search filters for client project discovery.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_web",
  skills: ["node"]
};

test("createJobSchema rejects non-finite budget values", () => {
  assert.equal(createJobSchema.safeParse({ ...validJob, budgetMin: Infinity }).success, false);
  assert.equal(createJobSchema.safeParse({ ...validJob, budgetMax: Infinity }).success, false);
});
