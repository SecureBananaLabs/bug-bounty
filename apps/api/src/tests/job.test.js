import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";

test("job creation requires clientId", () => {
  const parsed = createJobSchema.parse({
    clientId: "usr_123",
    title: "Build landing page",
    description: "Need a landing page for the new product launch",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "cat_1",
    skills: ["react"]
  });

  assert.equal(parsed.clientId, "usr_123");
  assert.equal(parsed.title, "Build landing page");
  assert.throws(() => createJobSchema.parse({
    title: "Build landing page",
    description: "Need a landing page for the new product launch",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "cat_1",
    skills: ["react"]
  }));
});
