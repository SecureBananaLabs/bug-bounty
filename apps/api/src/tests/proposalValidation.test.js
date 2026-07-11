import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can deliver this project with a tested implementation.",
  bidAmount: 750
};

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

async function postProposal(baseUrl, body) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/proposals rejects invalid proposal payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      ...validProposal,
      jobId: " ",
      bidAmount: -1
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.path.includes("jobId")));
    assert.ok(payload.errors.some((error) => error.path.includes("bidAmount")));
  });
});

test("POST /api/proposals creates valid proposals", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, validProposal);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, validProposal.jobId);
    assert.equal(payload.data.freelancerId, validProposal.freelancerId);
    assert.equal(payload.data.coverLetter, validProposal.coverLetter);
    assert.equal(payload.data.bidAmount, validProposal.bidAmount);
    assert.match(payload.data.id, /^prp_/);
  });
});
