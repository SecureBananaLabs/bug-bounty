import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can build this dashboard with tested API integrations.",
  bidAmount: 1800,
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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

test("POST /api/proposals rejects empty proposal payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {});

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid proposal payload" });
  });
});

test("POST /api/proposals rejects negative bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {
      ...validProposal,
      bidAmount: -1
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid proposal payload" });
  });
});

test("POST /api/proposals rejects missing estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { estimatedDuration, ...proposalWithoutDuration } = validProposal;
    const { response, payload } = await postProposal(baseUrl, proposalWithoutDuration);

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid proposal payload" });
  });
});

test("POST /api/proposals creates proposals from validated fields only", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postProposal(baseUrl, {
      id: "prp_attacker",
      ...validProposal,
      coverLetter: `  ${validProposal.coverLetter}  `
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, "prp_attacker");
    assert.equal(payload.data.jobId, validProposal.jobId);
    assert.equal(payload.data.freelancerId, validProposal.freelancerId);
    assert.equal(payload.data.coverLetter, validProposal.coverLetter);
    assert.equal(payload.data.estimatedDuration, validProposal.estimatedDuration);
  });
});
