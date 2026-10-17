import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("generated proposal id wins over a caller supplied one", async () => {
  const created = await createProposal({
    id: "caller-owned",
    jobId: "job_54",
    freelancerId: "usr_54",
    amount: 750
  });

  assert.match(created.id, /^prp_\d+$/);
  assert.equal(created.jobId, "job_54");
  assert.equal(created.amount, 750);

  const listed = await listProposals();
  assert.ok(listed.some((item) => item.id === created.id));
});

test("proposal creation still generates an id when the payload has none", async () => {
  const created = await createProposal({
    jobId: "job_55",
    freelancerId: "usr_55",
    amount: 120
  });

  assert.match(created.id, /^prp_\d+$/);
  assert.equal(created.freelancerId, "usr_55");
});
