import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposal } from "../services/proposalService.js";

const validProposal = {
  coverLetter: "I can deliver this project quickly.",
  bidAmount: 750,
  estDuration: "2 weeks",
  jobId: "job_1",
  freelancerId: "usr_1",
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

test("POST /api/proposals rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload",
    });
  });
});

test("POST /api/proposals rejects invalid bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validProposal, bidAmount: 0 }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload",
    });
  });
});

test("POST /api/proposals creates valid proposals", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProposal),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_\d+$/);
    assert.equal(payload.data.bidAmount, validProposal.bidAmount);
  });
});

test("createProposal preserves server-owned ids", async () => {
  const proposal = await createProposal({
    ...validProposal,
    id: "client-id",
  });

  assert.match(proposal.id, /^prp_\d+$/);
  assert.notEqual(proposal.id, "client-id");
});
