import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { updateJobStatus } from "../services/jobService.js";
import { JOB_STATUS_VALUES, updateJobStatusSchema } from "../validators/job.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("updateJobStatusSchema accepts valid JobStatus values and rejects extra or invalid fields", () => {
  for (const status of JOB_STATUS_VALUES) {
    const parsed = updateJobStatusSchema.parse({ status });
    assert.equal(parsed.status, status);
  }

  assert.throws(() => updateJobStatusSchema.parse({ status: "ARCHIVED" }));
  assert.throws(() =>
    updateJobStatusSchema.parse({ status: "OPEN", title: "Unauthorized edit" })
  );
});

test("updateJobStatus returns null for invalid or blank job IDs", async () => {
  assert.equal(await updateJobStatus(null, "OPEN"), null);
  assert.equal(await updateJobStatus("", "OPEN"), null);
  assert.equal(await updateJobStatus("   ", "OPEN"), null);
  assert.equal(await updateJobStatus("job_unknown_123", "OPEN"), null);
});

test("PATCH /api/jobs/:id/status updates only lifecycle status and returns 404/400 on invalid inputs", async () => {
  await withServer(async (baseUrl) => {
    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Build Rust Indexer",
        description: "High-throughput EVM block indexer in Rust",
        budgetMin: 1500,
        budgetMax: 3000,
        categoryId: "cat_web3",
        skills: ["rust", "evm"]
      })
    });
    assert.equal(createRes.status, 201);
    const createdBody = await createRes.json();
    const jobId = createdBody.data.id;

    // Valid transition to IN_PROGRESS
    const patchRes = await fetch(`${baseUrl}/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.success, true);
    assert.equal(patchBody.data.id, jobId);
    assert.equal(patchBody.data.status, "IN_PROGRESS");
    assert.equal(patchBody.data.title, "Build Rust Indexer");

    // Reject invalid status value with 400
    const badStatusRes = await fetch(`${baseUrl}/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" })
    });
    assert.equal(badStatusRes.status, 400);
    assert.deepEqual(await badStatusRes.json(), {
      success: false,
      message: "Invalid job status"
    });

    // Reject unknown job id with 404
    const missingRes = await fetch(`${baseUrl}/api/jobs/job_nonexistent/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" })
    });
    assert.equal(missingRes.status, 404);
    assert.deepEqual(await missingRes.json(), {
      success: false,
      message: "Job not found"
    });
  });
});
