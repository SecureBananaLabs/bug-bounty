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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/jobs rejects inverted budget range with 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Backend task",
        description: "Build endpoint validation and tests",
        budgetMin: 500,
        budgetMax: 100,
        categoryId: "cat-1",
        skills: ["node"]
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  });
});

test("updateJobSchema rejects inverted budget range when both values are present", () => {
  assert.throws(
    () =>
      updateJobSchema.parse({
        budgetMin: 700,
        budgetMax: 200
      }),
    /budgetMax must be greater than or equal to budgetMin/,
  );
});

test("updateJobSchema accepts payload when only one budget field is provided", () => {
  const parsed = updateJobSchema.parse({ budgetMin: 300 });
  assert.equal(parsed.budgetMin, 300);
});
