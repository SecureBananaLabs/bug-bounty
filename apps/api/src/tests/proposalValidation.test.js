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
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals stores only validated proposal fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job-101",
        freelancerId: "maya-dev",
        coverLetter: "I can build this widget with analytics-ready handoff states.",
        bidAmount: 1500,
        status: "approved"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.status, undefined);
    assert.equal(payload.data.jobId, "job-101");
  });
});

test("GET /api/proposals includes valid created proposals", async () => {
  await withServer(async (baseUrl) => {
    const proposal = {
      jobId: "job-102",
      freelancerId: "jordan-ux",
      coverLetter: "I can map the onboarding flows and prepare a clear handoff.",
      bidAmount: 900
    };

    const createResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(proposal)
    });
    const createPayload = await createResponse.json();
    const listResponse = await fetch(`${baseUrl}/api/proposals`);
    const listPayload = await listResponse.json();

    assert.equal(createResponse.status, 201);
    assert.ok(listPayload.data.some((item) => item.id === createPayload.data.id));
  });
});
