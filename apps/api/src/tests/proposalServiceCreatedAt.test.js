import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal includes a server-owned createdAt timestamp", async () => {
  const proposal = await createProposal({
    jobId: "job_project",
    freelancerId: "usr_freelancer",
    coverLetter: "I can deliver this project.",
    createdAt: "1999-01-01T00:00:00.000Z"
  });
  const proposals = await listProposals();
  const storedProposal = proposals.find((candidate) => candidate.id === proposal.id);

  assert.match(proposal.id, /^prp_/);
  assert.equal(proposal.jobId, "job_project");
  assert.equal(proposal.freelancerId, "usr_freelancer");
  assert.equal(proposal.coverLetter, "I can deliver this project.");
  assert.notEqual(proposal.createdAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(proposal.createdAt).toISOString());
  assert.equal(storedProposal.createdAt, proposal.createdAt);
});
