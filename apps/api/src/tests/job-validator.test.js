import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a polished landing page for a client",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web"
};

test("createJobSchema defaults missing skills to an empty array", () => {
  const result = createJobSchema.parse(validJob);

  assert.deepEqual(result.skills, []);
});

test("createJobSchema accepts normal skills arrays", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    skills: ["react", "typescript", "css"]
  });

  assert.equal(result.success, true);
});

test("createJobSchema rejects oversized skills arrays", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    skills: Array.from({ length: 21 }, (_, index) => `skill-${index}`)
  });

  assert.equal(result.success, false);
});

test("updateJobSchema applies the same skills cap when skills are provided", () => {
  const validUpdate = updateJobSchema.safeParse({ skills: ["node"] });
  const invalidUpdate = updateJobSchema.safeParse({
    skills: Array.from({ length: 21 }, (_, index) => `skill-${index}`)
  });

  assert.equal(validUpdate.success, true);
  assert.equal(invalidUpdate.success, false);
});
