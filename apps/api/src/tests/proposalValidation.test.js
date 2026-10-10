import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposalSchema, updateProposalSchema } from "../validators/proposal.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("createProposalSchema accepts a positive bid", () => {
  const parsed = createProposalSchema.parse({
    jobId: "job_1",
    coverLetter: "I can deliver this listing quickly and carefully.",
    bid: 250
  });

  assert.equal(parsed.bid, 250);
  assert.equal(parsed.jobId, "job_1");
});

test("createProposalSchema rejects zero and negative bids", () => {
  assert.throws(() =>
    createProposalSchema.parse({ jobId: "job_1", coverLetter: "x".repeat(20), bid: 0 })
  );
  assert.throws(() =>
    createProposalSchema.parse({ jobId: "job_1", coverLetter: "x".repeat(20), bid: -40 })
  );
});

test("updateProposalSchema allows partial payloads", () => {
  const parsed = updateProposalSchema.parse({ bid: 120 });

  assert.equal(parsed.bid, 120);
});

test("POST /api/proposals rejects a non-positive bid with 400", async () => {
  const server = await listen(createApp());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "job_1", coverLetter: "x".repeat(20), bid: -5 })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "bid must be valid");

  await close(server);
});

test("POST /api/proposals stores a valid proposal", async () => {
  const server = await listen(createApp());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jobId: "job_1",
      coverLetter: "I will finish this within two days.",
      bid: 300
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.bid, 300);

  await close(server);
});
