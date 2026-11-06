import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a job board",
  description: "Create a small job board for freelance projects.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "development",
  skills: ["node"]
};

test("createJobSchema accepts an ordered budget range", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("createJobSchema accepts an equal budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1500,
    budgetMax: 1500
  });

  assert.equal(result.success, true);
});

test("createJobSchema rejects an inverted budget range", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1500,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("updateJobSchema accepts partial budget updates", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500
  });

  assert.equal(result.success, true);
});

test("updateJobSchema rejects an inverted budget range when both values are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 1500,
    budgetMax: 500
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "budgetMax");
});

test("POST /api/jobs rejects an inverted budget range with a client error", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...validJob,
        budgetMin: 1500,
        budgetMax: 500
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Validation failed"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/jobs still creates a job with a valid budget range", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJob)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, validJob.budgetMin);
    assert.equal(payload.data.budgetMax, validJob.budgetMax);
    assert.equal(payload.data.status, "open");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
