import test from "node:test";
import assert from "node:assert/strict";
import {
  DuplicateProposalError,
  createProposal,
  listProposals
} from "../services/proposalService.js";

function proposalPayload(overrides = {}) {
  const suffix = `${Date.now()}-${Math.random()}`;

  return {
    jobId: `job_${suffix}`,
    freelancerId: `usr_${suffix}`,
    coverLetter: "I can deliver the scoped implementation.",
    bidAmount: 250,
    estDuration: "3 days",
    ...overrides
  };
}

test("createProposal rejects a duplicate proposal for the same job and freelancer", async () => {
  const payload = proposalPayload();

  const created = await createProposal(payload);
  assert.equal(created.jobId, payload.jobId);
  assert.equal(created.freelancerId, payload.freelancerId);

  await assert.rejects(
    () => createProposal({ ...payload, bidAmount: 300 }),
    DuplicateProposalError
  );

  const matchingProposals = (await listProposals()).filter(
    (proposal) =>
      proposal.jobId === payload.jobId &&
      proposal.freelancerId === payload.freelancerId
  );

  assert.equal(matchingProposals.length, 1);
  assert.equal(matchingProposals[0].bidAmount, 250);
});

test("createProposal allows the same freelancer on different jobs", async () => {
  const freelancerId = `usr_same_freelancer_${Date.now()}-${Math.random()}`;
  const first = await createProposal(proposalPayload({ freelancerId }));
  const second = await createProposal(proposalPayload({ freelancerId }));

  assert.equal(first.freelancerId, freelancerId);
  assert.equal(second.freelancerId, freelancerId);
  assert.notEqual(first.jobId, second.jobId);
});

test("createProposal allows different freelancers on the same job", async () => {
  const jobId = `job_same_job_${Date.now()}-${Math.random()}`;
  const first = await createProposal(proposalPayload({ jobId }));
  const second = await createProposal(proposalPayload({ jobId }));

  assert.equal(first.jobId, jobId);
  assert.equal(second.jobId, jobId);
  assert.notEqual(first.freelancerId, second.freelancerId);
});
