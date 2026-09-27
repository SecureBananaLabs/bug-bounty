import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  createProposal,
  DuplicateProposalError,
  listProposals
} from "../services/proposalService.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function proposalPayload(overrides = {}) {
  return {
    jobId: "job_duplicate_service",
    freelancerId: "freelancer_duplicate_service",
    coverLetter: "I can handle this project.",
    bidAmount: 200,
    ...overrides
  };
}

test("createProposal rejects duplicate proposals for the same job and freelancer", async () => {
  const listLengthBefore = (await listProposals()).length;

  await createProposal(proposalPayload());
  await assert.rejects(() => createProposal(proposalPayload()), DuplicateProposalError);
  assert.equal((await listProposals()).length, listLengthBefore + 1);
});

test("createProposal preserves proposals for different jobs or freelancers", async () => {
  const listLengthBefore = (await listProposals()).length;

  await createProposal(
    proposalPayload({
      jobId: "job_distinct_a",
      freelancerId: "freelancer_distinct"
    })
  );
  await createProposal(
    proposalPayload({
      jobId: "job_distinct_b",
      freelancerId: "freelancer_distinct"
    })
  );
  await createProposal(
    proposalPayload({
      jobId: "job_distinct_a",
      freelancerId: "freelancer_other"
    })
  );

  assert.equal((await listProposals()).length, listLengthBefore + 3);
});

test("POST /api/proposals returns 409 for duplicate proposals", async () => {
  const listLengthBefore = (await listProposals()).length;
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();
  const payload = proposalPayload({
    jobId: "job_duplicate_route",
    freelancerId: "freelancer_duplicate_route"
  });

  try {
    const firstResponse = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const secondResponse = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const secondPayload = await secondResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 409);
    assert.deepEqual(secondPayload, {
      success: false,
      message: "Freelancer already submitted a proposal for this job"
    });
    assert.equal((await listProposals()).length, listLengthBefore + 1);
  } finally {
    await close(server);
  }
});
