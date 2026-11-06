import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, body) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/proposals rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals rejects non-positive bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_123",
      coverLetter: "I can complete this task safely.",
      bidAmount: 0
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals accepts a valid proposal", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_123",
      coverLetter: "I can complete this task safely.",
      bidAmount: 125
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.jobId, "job_123");
    assert.equal(payload.data.freelancerId, "usr_123");
    assert.equal(payload.data.coverLetter, "I can complete this task safely.");
    assert.equal(payload.data.bidAmount, 125);
  });
});
