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

test("POST /api/proposals returns 400 for invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_123" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals accepts complete payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobId: "job_123",
        coverLetter: "I can deliver this quickly.",
        bidAmount: 450,
        estimatedDuration: "3 days"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_123");
    assert.equal(payload.data.coverLetter, "I can deliver this quickly.");
    assert.equal(payload.data.bidAmount, 450);
    assert.equal(payload.data.estimatedDuration, "3 days");
  });
});
