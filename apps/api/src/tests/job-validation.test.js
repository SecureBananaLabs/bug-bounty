import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { updateJobSchema } from "../validators/job.js";

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

const validJobPayload = {
  title: "Build landing page",
  description: "Create a focused landing page for a product launch.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react"]
};

test("POST /api/jobs rejects inverted budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validJobPayload,
        budgetMin: 500,
        budgetMax: 100
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/jobs accepts ordered budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJobPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.budgetMin, 100);
    assert.equal(payload.data.budgetMax, 500);
  });
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 }),
    /budgetMax must be greater than or equal to budgetMin/
  );

  assert.doesNotThrow(() => updateJobSchema.parse({ budgetMin: 100 }));
  assert.doesNotThrow(() => updateJobSchema.parse({ budgetMin: 100, budgetMax: 500 }));
});
