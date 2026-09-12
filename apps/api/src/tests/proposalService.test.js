import { randomUUID } from "node:crypto";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals, resetProposalsForTest } from "../services/proposalService.js";

beforeEach(() => {
  resetProposalsForTest();
});

test("createProposal ignores a client-provided id and stores the generated proposal id", async () => {
  const jobId = `job_${randomUUID()}`;

  const proposal = await createProposal({
    id: "prp_client_supplied",
    jobId,
    freelancerId: "usr_123",
    coverLetter: "Focused proposal",
  });

  assert.match(proposal.id, /^prp_[0-9a-f-]+$/);
  assert.notStrictEqual(proposal.id, "prp_client_supplied");
  assert.strictEqual(proposal.jobId, jobId);
  assert.strictEqual(proposal.freelancerId, "usr_123");
  assert.strictEqual(proposal.coverLetter, "Focused proposal");

  const stored = (await listProposals()).find((entry) => entry.jobId === jobId);
  assert.strictEqual(stored?.id, proposal.id);
});