import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("proposal service keeps ids, timestamps, and stored records server-owned", async () => {
  const proposal = await createProposal({
    id: "client-proposal-id",
    submittedAt: "2000-01-01T00:00:00.000Z",
    jobId: "job_1",
    freelancerId: "user_1",
    coverLetter: "I can help with this job."
  });

  assert.notEqual(proposal.id, "client-proposal-id");
  assert.notEqual(proposal.submittedAt, "2000-01-01T00:00:00.000Z");
  assert.equal(proposal.jobId, "job_1");

  proposal.coverLetter = "mutated response";
  const firstList = await listProposals();
  assert.equal(firstList.at(-1).coverLetter, "I can help with this job.");

  firstList.at(-1).coverLetter = "mutated list item";
  const secondList = await listProposals();
  assert.equal(secondList.at(-1).coverLetter, "I can help with this job.");
});
