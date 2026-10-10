import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build analytics dashboard",
  description: "Create charts and filters for weekly metrics.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "analytics",
  skills: ["node"]
};

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJob(baseUrl, body) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("createJobSchema accepts ordered and equal budget ranges", () => {
  assert.equal(createJobSchema.safeParse(validJob).success, true);
  assert.equal(createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1000,
    budgetMax: 1000
  }).success, true);
});

test("updateJobSchema rejects inverted ranges only when both budget fields are present", () => {
  assert.equal(updateJobSchema.safeParse({ budgetMin: 2000 }).success, true);
  assert.equal(updateJobSchema.safeParse({ budgetMax: 1000 }).success, true);
  assert.equal(updateJobSchema.safeParse({
    budgetMin: 2000,
    budgetMax: 1000
  }).success, false);
});

test("POST /api/jobs rejects inverted budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, {
      ...validJob,
      budgetMin: 2000,
      budgetMax: 1000
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.path.includes("budgetMax")));
  });
});

test("POST /api/jobs still creates jobs with valid budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, validJob);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, validJob.budgetMin);
    assert.equal(payload.data.budgetMax, validJob.budgetMax);
    assert.equal(payload.data.status, "open");
  });
});
