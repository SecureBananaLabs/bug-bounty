import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("listProposals returns a defensive array snapshot", async () => {
  await createProposal({ jobId: "job_1", freelancerId: "usr_1" });

  const firstResult = await listProposals();
  firstResult.length = 0;
  firstResult.push({ id: "injected" });

  const secondResult = await listProposals();

  assert.ok(secondResult.some((proposal) => proposal.jobId === "job_1"));
  assert.equal(secondResult.some((proposal) => proposal.id === "injected"), false);
});
