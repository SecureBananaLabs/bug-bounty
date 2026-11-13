import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps id server-owned", async () => {
  const suppliedId = "prp_attacker_controlled";

  const proposal = await createProposal({
    id: suppliedId,
    amount: 123,
    note: "solid proposal",
  });

  assert.notEqual(proposal.id, suppliedId);
  assert.match(proposal.id, /^prp_[0-9]+$/);
  assert.equal(proposal.amount, 123);
  assert.equal(proposal.note, "solid proposal");
});
