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

function proposalPayload() {
  const suffix = `${Date.now()}-${Math.random()}`;

  return {
    jobId: `job_${suffix}`,
    freelancerId: `usr_${suffix}`,
    coverLetter: "I can deliver the scoped implementation.",
    bidAmount: 250,
    estDuration: "3 days"
  };
}

test("POST /api/proposals returns 409 for duplicate job/freelancer proposals", async () => {
  await withServer(async (baseUrl) => {
    const payload = proposalPayload();

    const firstResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const secondResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, bidAmount: 300 })
    });
    const secondPayload = await secondResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 409);
    assert.deepEqual(secondPayload, {
      success: false,
      message: `Freelancer ${payload.freelancerId} already has a proposal for job ${payload.jobId}`
    });

    const listResponse = await fetch(`${baseUrl}/api/proposals`);
    const listPayload = await listResponse.json();
    const matchingProposals = listPayload.data.filter(
      (proposal) =>
        proposal.jobId === payload.jobId &&
        proposal.freelancerId === payload.freelancerId
    );

    assert.equal(matchingProposals.length, 1);
    assert.equal(matchingProposals[0].bidAmount, 250);
  });
});
