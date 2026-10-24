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

test("POST /api/proposals validates proposal creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const valid = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_freelancer",
      coverLetter: "I can deliver this implementation with tests.",
      bidAmount: 250,
      estimatedDays: 5
    });
    const validPayload = await valid.json();

    assert.equal(valid.status, 201);
    assert.equal(validPayload.data.jobId, "job_123");
    assert.equal(validPayload.data.freelancerId, "usr_freelancer");

    const missingJob = await postProposal(baseUrl, {
      jobId: "",
      freelancerId: "usr_freelancer",
      coverLetter: "I can deliver this implementation with tests.",
      bidAmount: 250,
      estimatedDays: 5
    });
    const negativeBid = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_freelancer",
      coverLetter: "I can deliver this implementation with tests.",
      bidAmount: -1,
      estimatedDays: 5
    });
    const fractionalDays = await postProposal(baseUrl, {
      jobId: "job_123",
      freelancerId: "usr_freelancer",
      coverLetter: "I can deliver this implementation with tests.",
      bidAmount: 250,
      estimatedDays: 1.5
    });

    assert.equal(missingJob.status, 400);
    assert.equal(negativeBid.status, 400);
    assert.equal(fractionalDays.status, 400);
  });
});
