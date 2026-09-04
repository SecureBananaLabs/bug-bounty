import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

function validJob(overrides = {}) {
  return {
    title: "Build marketplace search",
    description: "Create a focused marketplace search implementation.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "engineering",
    skills: ["node"],
    ...overrides
  };
}

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

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse(validJob({
    budgetMin: 500,
    budgetMax: 100
  }));

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("updateJobSchema rejects inverted budget ranges when both bounds are supplied", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
});

test("POST /api/jobs rejects inverted budgets before creating a job", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validJob({
        budgetMin: 500,
        budgetMax: 100
      }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");

    const jobs = await fetch(`${baseUrl}/api/jobs`);
    const jobsPayload = await jobs.json();

    assert.equal(jobs.status, 200);
    assert.deepEqual(jobsPayload.data, []);
  });
});
