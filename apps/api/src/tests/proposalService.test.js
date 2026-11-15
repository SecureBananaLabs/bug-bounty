import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";



test("listProposals returns defensive snapshot", async () => {
  const list = await import("../services/proposalService.js").then(m => m.listProposals());
  const len = list.length;
  list.push({ malicious: true });
  
  const list2 = await import("../services/proposalService.js").then(m => m.listProposals());
  assert.equal(list2.length, len);
});
