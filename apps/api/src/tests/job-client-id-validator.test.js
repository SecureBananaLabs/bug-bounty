import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build a marketplace API",
  budgetMin: 100,
  budgetMax: 500,
  clientId: "usr_client_1",
  categoryId: "cat_backend",
  skills: ["node"]
};

test("job validation accepts a non-empty client owner", () => {
  assert.equal(createJobSchema.parse(validJob).clientId, "usr_client_1");
});

test("job validation rejects missing client owner", () => {
  const { clientId: _clientId, ...jobWithoutClient } = validJob;
  let error;

  try {
    createJobSchema.parse(jobWithoutClient);
  } catch (caughtError) {
    error = caughtError;
  }

  assert.equal(error.name, "ZodError");
  assert.deepEqual(error.issues[0].path, ["clientId"]);
});

test("job validation rejects empty client owner", () => {
  let error;

  try {
    createJobSchema.parse({ ...validJob, clientId: "" });
  } catch (caughtError) {
    error = caughtError;
  }

  assert.equal(error.name, "ZodError");
  assert.deepEqual(error.issues[0].path, ["clientId"]);
});
