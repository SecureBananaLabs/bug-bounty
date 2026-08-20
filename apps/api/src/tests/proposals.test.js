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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ coverLetter: "too short", arbitrary: true })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid request payload"
    });
  });
});

test("POST /api/proposals creates proposals from validated payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        coverLetter: "I can deliver this project with clean milestones.",
        bidAmount: 1200,
        estDuration: "2 weeks",
        jobId: "job_123",
        freelancerId: "usr_456"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.coverLetter, "I can deliver this project with clean milestones.");
    assert.equal(payload.data.bidAmount, 1200);
    assert.equal(payload.data.estDuration, "2 weeks");
    assert.equal(payload.data.jobId, "job_123");
    assert.equal(payload.data.freelancerId, "usr_456");
  });
});
