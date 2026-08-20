import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withApiServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(port, payload) {
  return fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

test("POST /api/proposals rejects missing estimatedDuration", async () => {
  await withApiServer(async (port) => {
    const response = await postProposal(port, {
      jobId: "job_123",
      userId: "usr_123",
      bidAmount: 250,
      coverLetter: "I can complete this proposal with the required details."
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid proposal payload");
  });
});

test("POST /api/proposals accepts valid proposal payload", async () => {
  await withApiServer(async (port) => {
    const response = await postProposal(port, {
      jobId: "job_123",
      userId: "usr_123",
      bidAmount: 250,
      estimatedDuration: 5,
      coverLetter: "I can complete this proposal with the required details."
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_123");
    assert.equal(payload.data.userId, "usr_123");
    assert.equal(payload.data.bidAmount, 250);
    assert.equal(payload.data.estimatedDuration, 5);
  });
});
