import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposalSchema } from "../validators/proposal.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can deliver this milestone.",
  bidAmount: 500,
  estimatedDays: 7
};

async function withServer(handler) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await handler(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function issuePaths(payload) {
  const result = createProposalSchema.safeParse(payload);
  assert.equal(result.success, false);
  return result.error.issues.map((issue) => issue.path.join("."));
}

test("proposal creation rejects negative bid amounts", () => {
  assert.deepEqual(issuePaths({ ...validProposal, bidAmount: -1 }), ["bidAmount"]);
});

test("proposal creation rejects negative estimated days", () => {
  assert.deepEqual(issuePaths({ ...validProposal, estimatedDays: -2 }), ["estimatedDays"]);
});

test("proposal creation rejects empty cover letters", () => {
  assert.deepEqual(issuePaths({ ...validProposal, coverLetter: "   " }), ["coverLetter"]);
});

test("proposal creation rejects caller-supplied system fields", () => {
  assert.deepEqual(issuePaths({ ...validProposal, id: "prp_attacker" }), [""]);
});

test("proposal creation accepts and normalizes valid payloads", () => {
  assert.deepEqual(
    createProposalSchema.parse({
      ...validProposal,
      coverLetter: "  I can deliver this milestone.  "
    }),
    validProposal
  );
});

test("POST /api/proposals returns 400 for invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validProposal, bidAmount: -10 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid proposal payload");
    assert.deepEqual(payload.issues.map((issue) => issue.path.join(".")), ["bidAmount"]);
  });
});

test("POST /api/proposals accepts valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validProposal)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.coverLetter, validProposal.coverLetter);
    assert.equal(payload.data.bidAmount, validProposal.bidAmount);
    assert.equal(payload.data.estimatedDays, validProposal.estimatedDays);
  });
});
