import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps proposal ids server-owned", async (t) => {
  t.mock.method(Date, "now", () => 1700000000000);

  const proposal = await createProposal({
    id: "prp_client_supplied",
    coverLetter: "I can help with this project."
  });

  assert.equal(proposal.id, "prp_1700000000000");
});
