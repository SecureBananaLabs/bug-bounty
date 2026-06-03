import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createJobSchema, MAX_JOB_SKILLS } from "../validators/job.js";

const baseJob = {
  title: "Build API",
  description: "Build a production API",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "cat_backend"
};

test("createJobSchema defaults omitted skills to an empty array", () => {
  const parsed = createJobSchema.parse(baseJob);

  assert.deepEqual(parsed.skills, []);
});

test("createJobSchema accepts up to the configured skill limit", () => {
  const skills = Array.from({ length: MAX_JOB_SKILLS }, (_, index) => `skill-${index}`);
  const parsed = createJobSchema.parse({ ...baseJob, skills });

  assert.deepEqual(parsed.skills, skills);
});

test("createJobSchema rejects oversized skills arrays", () => {
  const skills = Array.from({ length: MAX_JOB_SKILLS + 1 }, (_, index) => `skill-${index}`);

  assert.throws(
    () => createJobSchema.parse({ ...baseJob, skills }),
    (error) => {
      assert.ok(error instanceof ZodError);
      assert.equal(error.issues[0].path[0], "skills");
      assert.equal(error.issues[0].code, "too_big");
      return true;
    }
  );
});
