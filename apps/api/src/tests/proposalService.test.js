import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal ignores client-supplied id and uses server-generated id", async () => {
  const payload = {
    id: "untrusted_client_id",
    title: "Awesome Proposal",
    description: "I will do the work.",
    price: 500
  };

  const created = await createProposal(payload);

  // Assert that the generated id starts with 'prp_' and is NOT the client-supplied one
  assert.ok(created.id.startsWith("prp_"));
  assert.notEqual(created.id, "untrusted_client_id");

  // Assert that legitimate payload fields are preserved
  assert.equal(created.title, "Awesome Proposal");
  assert.equal(created.description, "I will do the work.");
  assert.equal(created.price, 500);

  // Assert it exists in listProposals
  const list = await listProposals();
  const found = list.find((p) => p.title === "Awesome Proposal");
  assert.ok(found);
  assert.notEqual(found.id, "untrusted_client_id");
});
