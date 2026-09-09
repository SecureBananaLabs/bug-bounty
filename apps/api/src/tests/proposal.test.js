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

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this safely.",
  bidAmount: 250,
  estDuration: "2 weeks"
};

test("POST /api/proposals rejects missing estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { estDuration, ...payloadWithoutDuration } = validProposal;

    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadWithoutDuration)
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid proposal payload" });
  });
});

test("POST /api/proposals rejects blank estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validProposal, estDuration: "   " })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid proposal payload" });
  });
});

test("POST /api/proposals accepts valid proposal payloads", async () => {
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
    assert.equal(payload.data.coverLetter, validProposal.coverLetter);
    assert.equal(payload.data.bidAmount, validProposal.bidAmount);
    assert.equal(payload.data.estDuration, validProposal.estDuration);
    assert.match(payload.data.id, /^prp_/);
  });
});
