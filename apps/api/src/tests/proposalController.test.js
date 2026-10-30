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

  const { port } = server.address();

  try {
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validProposal(overrides = {}) {
  return {
    jobId: "job_1",
    freelancerId: "usr_1",
    bidAmount: 250,
    estimatedDays: 7,
    coverLetter: "I can complete this work with tests and documentation.",
    ...overrides,
  };
}

async function assertBadProposal(baseUrl, body) {
  const response = await postProposal(baseUrl, body);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "Invalid proposal payload" });
}

test("POST /api/proposals rejects negative bidAmount", async () => {
  await withServer(async (baseUrl) => {
    await assertBadProposal(baseUrl, validProposal({ bidAmount: -1 }));
  });
});

test("POST /api/proposals rejects negative estimatedDays", async () => {
  await withServer(async (baseUrl) => {
    await assertBadProposal(baseUrl, validProposal({ estimatedDays: -1 }));
  });
});

test("POST /api/proposals rejects blank coverLetter", async () => {
  await withServer(async (baseUrl) => {
    await assertBadProposal(baseUrl, validProposal({ coverLetter: "   " }));
  });
});

test("POST /api/proposals creates proposals for valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const proposal = validProposal();
    const response = await postProposal(baseUrl, proposal);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_\d+$/);
    assert.equal(payload.data.bidAmount, proposal.bidAmount);
    assert.equal(payload.data.estimatedDays, proposal.estimatedDays);
    assert.equal(payload.data.coverLetter, proposal.coverLetter);
  });
});
