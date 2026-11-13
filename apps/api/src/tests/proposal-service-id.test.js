import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal ignores caller-supplied id", async () => {
  const result = await createProposal({ coverLetter: "Hello", bidAmount: 500, id: "evil-id" });
  assert.notEqual(result.id, "evil-id");
  assert.ok(result.id.startsWith("prp_"));
});
