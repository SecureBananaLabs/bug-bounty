import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Need a responsive marketing landing page.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web"
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 500, budgetMax: 100 });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("createJobSchema accepts an ordered budget range", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
});

test("createJobSchema accepts an equal budget range", () => {
  const result = createJobSchema.safeParse({ ...validJob, budgetMin: 250, budgetMax: 250 });
  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted range when both bounds are present", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 }).success, false);
});

test("updateJobSchema allows a partial update with a single budget bound", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMax: 100 }).success, true);
});

test("POST /api/jobs returns 400 for an inverted budget range", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...validJob, budgetMin: 500, budgetMax: 100 })
  });

  assert.equal(response.status, 400);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
