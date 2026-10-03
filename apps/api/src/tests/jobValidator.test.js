import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

function validJob(overrides = {}) {
  return {
    title: "Build a landing page",
    description: "Create a responsive marketing landing page.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "web",
    skills: ["react"],
    ...overrides
  };
}

test("createJobSchema accepts title and description at the maximum length", () => {
  const payload = validJob({
    title: "T".repeat(200),
    description: "D".repeat(5000)
  });

  const parsed = createJobSchema.parse(payload);

  assert.equal(parsed.title.length, 200);
  assert.equal(parsed.description.length, 5000);
});

test("createJobSchema rejects overlong title and description", () => {
  assert.throws(
    () => createJobSchema.parse(validJob({ title: "T".repeat(201) })),
    /String must contain at most 200/
  );
  assert.throws(
    () => createJobSchema.parse(validJob({ description: "D".repeat(5001) })),
    /String must contain at most 5000/
  );
});

test("updateJobSchema keeps maximum length validation for partial updates", () => {
  assert.throws(
    () => updateJobSchema.parse({ title: "T".repeat(201) }),
    /String must contain at most 200/
  );
  assert.throws(
    () => updateJobSchema.parse({ description: "D".repeat(5001) }),
    /String must contain at most 5000/
  );
});
