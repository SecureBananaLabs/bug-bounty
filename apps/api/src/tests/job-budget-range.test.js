import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

function validJobPayload(overrides = {}) {
  return {
    title: "Senior Backend Engineer",
    description: "Build and maintain APIs for client projects",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_dev",
    skills: ["node"],
    ...overrides
  };
}

test("createJobSchema accepts ordered and equal budget ranges", () => {
  const ordered = createJobSchema.safeParse(validJobPayload());
  const equal = createJobSchema.safeParse(validJobPayload({ budgetMin: 250, budgetMax: 250 }));

  assert.equal(ordered.success, true);
  assert.equal(equal.success, true);
});

test("createJobSchema rejects inverted budget ranges", () => {
  const parsed = createJobSchema.safeParse(validJobPayload({ budgetMin: 500, budgetMax: 100 }));

  assert.equal(parsed.success, false);
  assert.equal(parsed.error.issues[0]?.path.join("."), "budgetMax");
});

test("updateJobSchema rejects inverted ranges only when both fields are present", () => {
  const inverted = updateJobSchema.safeParse({ budgetMin: 500, budgetMax: 100 });
  const singleField = updateJobSchema.safeParse({ budgetMax: 300 });

  assert.equal(inverted.success, false);
  assert.equal(singleField.success, true);
});

test("POST /api/jobs returns 400 for inverted budget ranges", async () => {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJobPayload({ budgetMin: 500, budgetMax: 100 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job payload"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
