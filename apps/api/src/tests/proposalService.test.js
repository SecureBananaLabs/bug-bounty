import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal adds a server-side createdAt timestamp", async () => {
  const proposal = await createProposal({
    coverLetter: "I can deliver this project.",
    bidAmount: 300,
    estDuration: "1 week",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const proposals = await listProposals();
  const storedProposal = proposals.find((candidate) => candidate.id === proposal.id);

  assert.match(proposal.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.doesNotThrow(() => new Date(proposal.createdAt).toISOString());
  assert.notEqual(proposal.createdAt, "2000-01-01T00:00:00.000Z");
  assert.equal(storedProposal.createdAt, proposal.createdAt);
});
