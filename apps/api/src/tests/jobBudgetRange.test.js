import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJobPayload = {
  title: "Frontend build",
  description: "Build the frontend implementation",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "development",
  skills: ["react"]
};

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJobPayload,
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ["budgetMax"]);
  assert.equal(result.error.issues[0].message, "budgetMax must be greater than or equal to budgetMin");
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJobPayload);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted ranges only when both budget fields are present", () => {
  const invertedResult = updateJobSchema.safeParse({
    budgetMin: 500,
    budgetMax: 100
  });

  assert.equal(invertedResult.success, false);

  const partialResult = updateJobSchema.safeParse({
    budgetMax: 100
  });

  assert.equal(partialResult.success, true);
});

test("POST /api/jobs returns 400 for inverted budget ranges", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...validJobPayload,
        budgetMin: 500,
        budgetMax: 100
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.deepEqual(payload.errors[0].path, ["budgetMax"]);
  } finally {
    await close(server);
  }
});
