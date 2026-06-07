import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("proposal service returns defensive copies of stored proposals", async () => {
  const created = await createProposal({
    jobId: "job_1",
    freelancerId: "freelancer_1",
    coverLetter: "I can deliver the milestone.",
    bidAmount: 1200,
  });

  created.coverLetter = "mutated returned proposal";

  const firstList = await listProposals();
  const storedProposal = firstList.find((proposal) => proposal.id === created.id);

  assert.equal(storedProposal.coverLetter, "I can deliver the milestone.");

  firstList.push({ id: "prp_fake", coverLetter: "injected" });
  storedProposal.coverLetter = "mutated list proposal";

  const secondList = await listProposals();
  const preservedProposal = secondList.find((proposal) => proposal.id === created.id);

  assert.equal(secondList.some((proposal) => proposal.id === "prp_fake"), false);
  assert.equal(preservedProposal.coverLetter, "I can deliver the milestone.");
});
