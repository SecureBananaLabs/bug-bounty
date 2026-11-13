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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postProposal(baseUrl, payload) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function validProposal(overrides = {}) {
  return {
    coverLetter: "I can complete this project with a focused implementation plan.",
    bidAmount: 250,
    estDuration: "2 weeks",
    jobId: "job_1",
    freelancerId: "usr_freelancer",
    ...overrides
  };
}

test("POST /api/proposals rejects missing required proposal fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      coverLetter: "I can help"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals rejects non-positive bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, validProposal({ bidAmount: 0 }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid proposal payload"
    });
  });
});

test("POST /api/proposals preserves server-generated ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, validProposal({ id: "prp_attacker" }));
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.notEqual(payload.data.id, "prp_attacker");
    assert.equal(payload.data.bidAmount, 250);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.freelancerId, "usr_freelancer");
  });
});
