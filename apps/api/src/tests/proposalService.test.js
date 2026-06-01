import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal keeps ids server-owned", async () => {
  const proposal = await createProposal({ id: "prp_client", jobId: "job_1", coverLetter: "Hello" });

  assert.match(proposal.id, /^prp_/);
  assert.notEqual(proposal.id, "prp_client");
  assert.equal(proposal.jobId, "job_1");
});
