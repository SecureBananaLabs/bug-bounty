import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build landing page",
  description: "Create a marketing landing page.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "web",
  skills: ["nextjs"]
};

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

test("createJobSchema accepts ordered and equal budget ranges", () => {
  assert.equal(createJobSchema.parse(validJob).budgetMax, 1200);
  assert.equal(
    createJobSchema.parse({ ...validJob, budgetMin: 500, budgetMax: 500 }).budgetMax,
    500
  );
});

test("createJobSchema rejects inverted budget ranges", () => {
  assert.throws(
    () => createJobSchema.parse({ ...validJob, budgetMin: 1200, budgetMax: 500 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("updateJobSchema rejects inverted ranges only when both budget fields are present", () => {
  assert.deepEqual(updateJobSchema.parse({ budgetMin: 1200 }), { budgetMin: 1200 });
  assert.deepEqual(updateJobSchema.parse({ budgetMax: 500 }), { budgetMax: 500 });

  assert.throws(
    () => updateJobSchema.parse({ budgetMin: 1200, budgetMax: 500 }),
    /budgetMax must be greater than or equal to budgetMin/
  );
});

test("POST /api/jobs returns 400 for inverted budget ranges", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validJob, budgetMin: 1200, budgetMax: 500 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.deepEqual(payload.errors, [
      {
        path: "budgetMax",
        message: "budgetMax must be greater than or equal to budgetMin"
      }
    ]);
  });
});
