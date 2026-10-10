import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_freelancer",
  coverLetter: "I can complete this project with a clean implementation plan.",
  bidAmount: 1200,
  estimatedDuration: "2 weeks"
};

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

test("POST /api/proposals rejects proposals missing estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { estimatedDuration, ...missingDuration } = validProposal;
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(missingDuration)
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals rejects client-controlled IDs", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validProposal, id: "prp_attacker" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals creates valid proposals with a server-generated ID", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProposal)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, validProposal.jobId);
    assert.equal(payload.data.freelancerId, validProposal.freelancerId);
    assert.equal(payload.data.estimatedDuration, validProposal.estimatedDuration);
    assert.match(payload.data.id, /^prp_/);
    assert.notEqual(payload.data.id, "prp_attacker");
  });
});
