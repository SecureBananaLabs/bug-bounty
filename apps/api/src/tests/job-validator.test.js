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

test("createJobSchema trims and deduplicates skills", () => {
  const parsed = createJobSchema.parse({
    ...validJob,
    skills: [" React ", "Node.js", "React", " TypeScript "]
  });

  assert.deepEqual(parsed.skills, ["React", "Node.js", "TypeScript"]);
});

test("createJobSchema rejects blank skill names after trimming", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, skills: ["React", "   "] }),
    ZodError
  );
});

test("createJobSchema caps skill name and array length", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, skills: ["x".repeat(65)] }),
    ZodError
  );

  assert.throws(
    () => createJobSchema.parse({
      ...validJob,
      skills: Array.from({ length: 21 }, (_, index) => `skill-${index}`)
    }),
    ZodError
  );
});
