import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("listProposals returns a defensive array copy", async () => {
  const proposal = await createProposal({ jobId: "job_123" });
  const listedProposals = await listProposals();

  listedProposals.length = 0;

  const nextListedProposals = await listProposals();

  assert.equal(nextListedProposals.length, 1);
  assert.equal(nextListedProposals[0], proposal);
});
