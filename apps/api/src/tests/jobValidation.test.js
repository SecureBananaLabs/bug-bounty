import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a reporting dashboard",
  description: "Create a dashboard for weekly revenue and usage reporting.",
  budgetMin: 1000,
  budgetMax: 2500,
  categoryId: "analytics",
  skills: ["React", "SQL"]
};

test("createJobSchema accepts maximum length title and description", () => {
  const payload = createJobSchema.parse({
    ...validJob,
    title: "a".repeat(200),
    description: "b".repeat(5000)
  });

  assert.equal(payload.title.length, 200);
  assert.equal(payload.description.length, 5000);
});

test("createJobSchema rejects titles longer than 200 characters", () => {
  assert.throws(
    () =>
      createJobSchema.parse({
        ...validJob,
        title: "a".repeat(201)
      }),
    /String must contain at most 200 character/
  );
});

test("createJobSchema rejects descriptions longer than 5000 characters", () => {
  assert.throws(
    () =>
      createJobSchema.parse({
        ...validJob,
        description: "b".repeat(5001)
      }),
    /String must contain at most 5000 character/
  );
});

test("updateJobSchema applies title and description max lengths", () => {
  assert.throws(
    () => updateJobSchema.parse({ title: "a".repeat(201) }),
    /String must contain at most 200 character/
  );

  assert.throws(
    () => updateJobSchema.parse({ description: "b".repeat(5001) }),
    /String must contain at most 5000 character/
  );
});
