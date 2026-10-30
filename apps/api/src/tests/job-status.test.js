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

async function createJob(baseUrl) {
  const response = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Test job",
      description: "A job used for status endpoint tests",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "test-category",
      skills: []
    })
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  return payload.data;
}

test("PATCH /api/jobs/:id/status updates only the job status", async () => {
  await withServer(async (baseUrl) => {
    const job = await createJob(baseUrl);

    const response = await fetch(`${baseUrl}/api/jobs/${job.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.id, job.id);
    assert.equal(payload.data.status, "CANCELLED");
    assert.equal(payload.data.title, job.title);
  });
});

test("PATCH /api/jobs/:id/status rejects an invalid status", async () => {
  await withServer(async (baseUrl) => {
    const job = await createJob(baseUrl);

    const response = await fetch(`${baseUrl}/api/jobs/${job.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job status"
    });
  });
});

test("PATCH /api/jobs/:id/status returns 404 for an unknown job", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs/missing/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" })
    });
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, {
      success: false,
      message: "Job not found"
    });
  });
});
