import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposalSchema } from "../validators/proposal.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this safely.",
  bidAmount: 250,
  estDuration: "2 weeks"
};

test("createProposalSchema accepts a valid proposal", () => {
  assert.deepEqual(createProposalSchema.parse(validProposal), validProposal);
});

test("createProposalSchema rejects a missing estimated duration", () => {
  assert.throws(() => {
    createProposalSchema.parse({
      ...validProposal,
      estDuration: undefined
    });
  });
});

test("createProposalSchema rejects a blank estimated duration", () => {
  assert.throws(() => {
    createProposalSchema.parse({
      ...validProposal,
      estDuration: ""
    });
  });
});

test("createProposalSchema rejects non-positive bids", () => {
  assert.throws(() => {
    createProposalSchema.parse({
      ...validProposal,
      bidAmount: 0
    });
  });
});

test("POST /api/proposals rejects missing estimated duration", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Invalid request body"
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
