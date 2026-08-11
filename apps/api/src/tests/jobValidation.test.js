import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API",
  description: "Build marketplace API",
  budgetMin: 100,
  budgetMax: 500,
  clientId: "usr_client",
  categoryId: "cat_backend",
  skills: ["node"]
};

test("job creation requires clientId", () => {
  const { clientId, ...payload } = validJob;

  const result = createJobSchema.safeParse(payload);

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "clientId");
});

test("job creation rejects blank clientId", () => {
  const result = createJobSchema.safeParse({ ...validJob, clientId: "" });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "clientId");
});

test("job creation accepts clientId", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
  assert.equal(result.data.clientId, "usr_client");
});
