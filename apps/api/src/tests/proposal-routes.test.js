import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects missing estimatedDuration", async () => {
  await withServer(async (baseUrl) => {
    const beforeResponse = await fetch(`${baseUrl}/api/proposals`);
    const beforePayload = await beforeResponse.json();

    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        freelancerId: "usr_456",
        coverLetter: "I can deliver this milestone this week.",
        priceUsd: 500
      })
    });
    const payload = await response.json();

    const afterResponse = await fetch(`${baseUrl}/api/proposals`);
    const afterPayload = await afterResponse.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "estimatedDuration is required"
    });
    assert.equal(afterPayload.data.length, beforePayload.data.length);
  });
});

test("POST /api/proposals accepts payloads with estimatedDuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        freelancerId: "usr_456",
        coverLetter: "I can deliver this milestone this week.",
        priceUsd: 500,
        estimatedDuration: "5 business days"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.estimatedDuration, "5 business days");
    assert.match(payload.data.id, /^prp_/);
  });
});
