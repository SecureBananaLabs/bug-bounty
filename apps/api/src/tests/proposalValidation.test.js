import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function postProposal(baseUrl, body) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/proposals accepts public proposal fields", async () => {
  const server = await startServer();
  try {
    const response = await postProposal(server.baseUrl, {
      coverLetter: "I can deliver the migration with tests and weekly status updates.",
      bidAmount: 1200,
      estDuration: "2 weeks",
      jobId: "job_101",
      freelancerId: "usr_freelancer"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_\d+$/);
    assert.equal(payload.data.coverLetter, "I can deliver the migration with tests and weekly status updates.");
    assert.equal(payload.data.bidAmount, 1200);
    assert.equal(payload.data.estDuration, "2 weeks");
    assert.equal(payload.data.jobId, "job_101");
    assert.equal(payload.data.freelancerId, "usr_freelancer");
    assert.equal("status" in payload.data, false);
    assert.equal("acceptedAt" in payload.data, false);
  } finally {
    await server.close();
  }
});

test("POST /api/proposals rejects internal field injection", async () => {
  const server = await startServer();
  try {
    const response = await postProposal(server.baseUrl, {
      id: "prp_attacker",
      status: "accepted",
      acceptedAt: "2026-06-07T00:00:00.000Z",
      coverLetter: "Please accept this proposal with injected internal fields.",
      bidAmount: 500,
      estDuration: "3 days",
      jobId: "job_102",
      freelancerId: "usr_attacker"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });

    const listResponse = await fetch(`${server.baseUrl}/api/proposals`);
    const listPayload = await listResponse.json();
    assert.equal(listPayload.data.some((proposal) => proposal.id === "prp_attacker"), false);
  } finally {
    await server.close();
  }
});

test("POST /api/proposals rejects invalid bid amounts", async () => {
  const server = await startServer();
  try {
    const response = await postProposal(server.baseUrl, {
      coverLetter: "I can complete this project but the bid amount is invalid.",
      bidAmount: 0,
      estDuration: "1 week",
      jobId: "job_103",
      freelancerId: "usr_freelancer"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  } finally {
    await server.close();
  }
});
