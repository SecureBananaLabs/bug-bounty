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

function createValidProposal(overrides = {}) {
  return {
    coverLetter: "I can deliver this project quickly and cleanly.",
    bidAmount: 1500,
    estDuration: "2 weeks",
    jobId: "job_1",
    freelancerId: "user_1",
    ...overrides
  };
}

test("POST /api/proposals rejects zero bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidProposal({ bidAmount: 0 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "bidAmount must be a positive number"
    });
  });
});

test("POST /api/proposals rejects negative bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidProposal({ bidAmount: -10 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "bidAmount must be a positive number"
    });
  });
});

test("POST /api/proposals rejects non-numeric bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidProposal({ bidAmount: "free" }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "bidAmount must be a positive number"
    });
  });
});

test("POST /api/proposals keeps valid positive bid amounts working", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidProposal({ bidAmount: 1800 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.bidAmount, 1800);
    assert.equal(payload.data.coverLetter, "I can deliver this project quickly and cleanly.");
    assert.equal(payload.data.estDuration, "2 weeks");
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.freelancerId, "user_1");
    assert.match(payload.data.id, /^prp_/);
  });
});
