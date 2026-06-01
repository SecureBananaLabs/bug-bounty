import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal adds a server-side createdAt timestamp", async () => {
  const proposal = await createProposal({
    coverLetter: "I can deliver this project.",
    bidAmount: 300,
    estDuration: "1 week",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  assert.match(proposal.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.notEqual(proposal.createdAt, "2000-01-01T00:00:00.000Z");
});
