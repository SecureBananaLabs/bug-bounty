import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";
import { createApp } from "../app.js";

test("Validator: createJobSchema accepts valid budget ranges", () => {
  const validData = {
    title: "Senior Fullstack Developer",
    description: "Looking for an expert React and Node.js developer.",
    budgetMin: 50,
    budgetMax: 100,
    categoryId: "cat_123",
    skills: ["React", "Node"]
  };

  const result = createJobSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test("Validator: createJobSchema rejects inverted budget ranges", () => {
  const invalidData = {
    title: "Senior Fullstack Developer",
    description: "Looking for an expert React and Node.js developer.",
    budgetMin: 150,
    budgetMax: 100,
    categoryId: "cat_123",
    skills: ["React", "Node"]
  };

  const result = createJobSchema.safeParse(invalidData);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "budgetMin must be less than or equal to budgetMax");
});

test("Validator: updateJobSchema accepts partial updates", () => {
  const partialUpdate = {
    title: "Lead Frontend Engineer"
  };

  const result = updateJobSchema.safeParse(partialUpdate);
  assert.equal(result.success, true);
});

test("Validator: updateJobSchema rejects inverted budget ranges on partial updates", () => {
  const invalidPartial = {
    budgetMin: 500,
    budgetMax: 200
  };

  const result = updateJobSchema.safeParse(invalidPartial);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "budgetMin must be less than or equal to budgetMax");
});

test("Integration: POST /api/jobs rejects inverted budget ranges", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        title: "Senior Dev",
        description: "Looking for a seasoned architect.",
        budgetMin: 200,
        budgetMax: 100,
        categoryId: "cat_999",
        skills: ["Arch"]
      })
    });

    console.log("[TEST] Received response status:", response.status);
    assert.equal(response.status, 400);

    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.errors[0].message, "budgetMin must be less than or equal to budgetMax");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Integration: POST /api/jobs accepts valid budget ranges", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        title: "Senior Dev",
        description: "Looking for a seasoned architect.",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "cat_999",
        skills: ["Arch"]
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, 100);
    assert.equal(payload.data.budgetMax, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
