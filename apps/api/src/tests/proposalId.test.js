import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("Proposal creation ID preservation", async (t) => {
  await t.test("ignores client-supplied id", async () => {
    const proposal = await createProposal({
      id: "custom_id_123",
      bidAmount: 100,
      description: "Build landing page"
    });
    assert.match(proposal.id, /^prp_\d+$/);
    assert.notEqual(proposal.id, "custom_id_123");
  });

  await t.test("preserves other payload fields", async () => {
    const proposal = await createProposal({
      id: "custom_id_123",
      bidAmount: 250,
      description: "Build checkout components"
    });
    assert.equal(proposal.bidAmount, 250);
    assert.equal(proposal.description, "Build checkout components");
  });
});
