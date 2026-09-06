import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build API docs",
  description: "Write and polish the first pass of the public API docs.",
  budgetMin: 500,
  budgetMax: 900,
  categoryId: "docs",
  skills: ["writing", "api"]
};

test("createJobSchema accepts a valid budget range", () => {
  assert.deepEqual(createJobSchema.parse(validJob), validJob);
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(() => {
    createJobSchema.parse({
      ...validJob,
      budgetMin: 900,
      budgetMax: 500
    });
  });
});

test("POST /api/jobs rejects inverted budget ranges", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...validJob,
      budgetMin: 900,
      budgetMax: 500
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Invalid request body"
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
