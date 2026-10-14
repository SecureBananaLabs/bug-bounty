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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects missing estimatedDuration", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        coverLetter: "ready to help",
        bidAmount: 100
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "jobId, coverLetter, positive bidAmount, and estimatedDuration are required"
    });
  });
});

test("POST /api/proposals rejects non-positive bidAmount", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        coverLetter: "ready to help",
        bidAmount: 0,
        estimatedDuration: "2 weeks"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "jobId, coverLetter, positive bidAmount, and estimatedDuration are required"
    });
  });
});

test("POST /api/proposals ignores caller-supplied ids", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "prp_hijack",
        jobId: "job_1",
        coverLetter: "ready to help",
        bidAmount: 100,
        estimatedDuration: "2 weeks"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.notEqual(payload.data.id, "prp_hijack");
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.coverLetter, "ready to help");
    assert.equal(payload.data.bidAmount, 100);
    assert.equal(payload.data.estimatedDuration, "2 weeks");
  });
});
