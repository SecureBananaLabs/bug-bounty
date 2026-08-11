import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("proposal service keeps records and ids server-owned", async () => {
  const initialProposals = await listProposals();
  const initialCount = initialProposals.length;

  const created = await createProposal({
    id: "prp_client_controlled",
    jobId: "job_proposal_copy",
    freelancerId: "usr_freelancer",
    coverLetter: "I can deliver this project cleanly",
    estimatedDuration: "3 days"
  });

  assert.match(created.id, /^prp_\d+$/);
  assert.notEqual(created.id, "prp_client_controlled");

  created.coverLetter = "mutated through returned create payload";

  const listedProposals = await listProposals();
  assert.equal(listedProposals.length, initialCount + 1);
  assert.equal(listedProposals.at(-1).coverLetter, "I can deliver this project cleanly");

  listedProposals.push({
    id: "prp_client_injected",
    jobId: "job_proposal_copy",
    freelancerId: "usr_attacker",
    coverLetter: "injected through list result",
    estimatedDuration: "1 day"
  });
  listedProposals.at(-2).coverLetter = "mutated through list result";

  const reloadedProposals = await listProposals();
  assert.equal(reloadedProposals.length, initialCount + 1);
  assert.equal(reloadedProposals.at(-1).id, created.id);
  assert.equal(reloadedProposals.at(-1).coverLetter, "I can deliver this project cleanly");
  assert.equal(
    reloadedProposals.some((proposal) => proposal.id === "prp_client_injected"),
    false
  );
});
