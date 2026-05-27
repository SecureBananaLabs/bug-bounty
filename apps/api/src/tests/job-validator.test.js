import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build a marketplace API",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "cat_backend"
};

test("job validation keeps omitted, empty, and unique skills valid", () => {
  assert.deepEqual(createJobSchema.parse(validJob).skills, []);
  assert.deepEqual(createJobSchema.parse({ ...validJob, skills: [] }).skills, []);
  assert.deepEqual(
    createJobSchema.parse({ ...validJob, skills: ["node", "react"] }).skills,
    ["node", "react"]
  );
});

test("job validation rejects duplicate skills case-insensitively", () => {
  let error;

  try {
    createJobSchema.parse({ ...validJob, skills: ["React", "node", "react"] });
  } catch (caughtError) {
    error = caughtError;
  }

  assert.equal(error.name, "ZodError");
  assert.equal(error.issues[0].message, "Skills must be unique");
  assert.deepEqual(error.issues[0].path, ["skills", 2]);
});
