import assert from "node:assert/strict";
import test from "node:test";

import { createProposal, listProposals } from "../services/proposalService.js";

test("listProposals returns a snapshot that cannot mutate stored proposals", async () => {
  const before = await listProposals();
  const proposal = await createProposal({
    jobId: "job_snapshot",
    freelancerId: "usr_snapshot",
    coverLetter: "I can complete this project.",
    bidAmount: 1200
  });

  const listed = await listProposals();
  listed.length = 0;
  listed.push({
    id: "prp_attacker",
    jobId: "job_attacker",
    freelancerId: "usr_attacker",
    coverLetter: "Injected proposal",
    bidAmount: 1
  });

  const afterMutation = await listProposals();
  assert.equal(afterMutation.length, before.length + 1);
  assert.ok(afterMutation.some((item) => item.id === proposal.id));
  assert.equal(afterMutation.some((item) => item.id === "prp_attacker"), false);
});
