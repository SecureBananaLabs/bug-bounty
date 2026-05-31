import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJob(baseUrl, payload) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function validJob(overrides = {}) {
  return {
    title: "Build admin reports",
    description: "Create operational reports for project owners.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "development",
    skills: ["node"],
    ...overrides
  };
}

test("POST /api/jobs rejects inverted budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, validJob({
      budgetMin: 1000,
      budgetMax: 100
    }));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/jobs accepts equal and ascending budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const equalBudget = await postJob(baseUrl, validJob({
      budgetMin: 250,
      budgetMax: 250
    }));
    assert.equal(equalBudget.status, 201);

    const ascendingBudget = await postJob(baseUrl, validJob({
      budgetMin: 100,
      budgetMax: 1000
    }));
    const payload = await ascendingBudget.json();

    assert.equal(ascendingBudget.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, 100);
    assert.equal(payload.data.budgetMax, 1000);
  });
});
