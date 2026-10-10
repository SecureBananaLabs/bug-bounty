import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("listProposals returns a defensive snapshot", async () => {
  const created = await createProposal({ jobId: "job_1", coverLetter: "Proposal" });
  const listed = await listProposals();

  listed.push({ id: "prp_injected", jobId: "job_2" });

  const listedAgain = await listProposals();

  assert.ok(listedAgain.some((proposal) => proposal.id === created.id));
  assert.equal(listedAgain.some((proposal) => proposal.id === "prp_injected"), false);
});
