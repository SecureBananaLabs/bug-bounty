import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { updateJobSchema } from "../validators/job.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function jobPayload(overrides = {}) {
  return {
    title: "Build a reporting dashboard",
    description: "Create a dashboard for tracking client project metrics.",
    budgetMin: 1000,
    budgetMax: 2500,
    categoryId: "analytics",
    skills: ["sql", "dashboarding"],
    ...overrides
  };
}

test("POST /api/jobs accepts a valid budget range", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(jobPayload())
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, 1000);
    assert.equal(payload.data.budgetMax, 2500);
  });
});

test("POST /api/jobs rejects inverted budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(jobPayload({ budgetMin: 3000, budgetMax: 500 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.issues[0].path[0], "budgetMax");
  });
});

test("updateJobSchema rejects partial updates that invert budget range", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 3000, budgetMax: 500 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});
