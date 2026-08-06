import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("listProposals returns defensive snapshots", async () => {
  await createProposal({
    jobId: "job_snapshot",
    freelancerId: "usr_snapshot",
    coverLetter: "Snapshot proposal",
    bidAmount: 450
  });

  const firstList = await listProposals();
  firstList.push({ id: "injected", coverLetter: "Injected proposal" });
  firstList[0].coverLetter = "Mutated proposal";

  const secondList = await listProposals();

  assert.equal(secondList.some((proposal) => proposal.id === "injected"), false);
  assert.equal(secondList.some((proposal) => proposal.coverLetter === "Mutated proposal"), false);
  assert.equal(secondList.some((proposal) => proposal.coverLetter === "Snapshot proposal"), true);
});
