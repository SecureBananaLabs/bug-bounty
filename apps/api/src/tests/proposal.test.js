import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposal } from "../services/proposalService.js";

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

test("POST /api/proposals rejects missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.deepEqual(payload.issues.map((issue) => issue.path[0]).sort(), [
      "bidAmount",
      "coverLetter",
      "freelancerId",
      "jobId"
    ]);
  });
});

test("POST /api/proposals rejects negative bid amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_1",
        bidAmount: -1,
        coverLetter: "I can do this."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.issues[0].path[0], "bidAmount");
  });
});

test("POST /api/proposals ignores caller-supplied ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "prp_attacker",
        jobId: "job_1",
        freelancerId: "usr_1",
        bidAmount: 100,
        coverLetter: "I can do this."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.notEqual(payload.data.id, "prp_attacker");
    assert.equal(payload.data.bidAmount, 100);
  });
});

test("createProposal keeps generated ids server-owned", async () => {
  const proposal = await createProposal({
    id: "prp_attacker",
    jobId: "job_1",
    freelancerId: "usr_1",
    bidAmount: 100,
    coverLetter: "I can do this."
  });

  assert.match(proposal.id, /^prp_/);
  assert.notEqual(proposal.id, "prp_attacker");
});
