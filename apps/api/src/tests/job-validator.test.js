import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build marketplace API",
  description: "Implement the marketplace API endpoints",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "software",
  skills: ["node"]
};

test("createJobSchema accepts a valid budget range", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 10000,
    budgetMax: 100
  });

  assert.equal(result.success, false);
});

test("createJobSchema reports a clear budgetMax path and message", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 10000,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  const issue = result.error.issues.find(({ path }) => path.join(".") === "budgetMax");

  assert.ok(issue);
  assert.equal(issue.message, "budgetMax must be greater than or equal to budgetMin");
});
