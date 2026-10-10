import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("listProposals hands out a snapshot the caller may reorder", async () => {
  const before = (await listProposals()).length;

  const created = await createProposal({ jobId: "job_1", amount: 480 });
  const listed = await listProposals();
  assert.equal(listed.length, before + 1);
  assert.equal(listed.at(-1).id, created.id);

  listed.splice(listed.length - 1, 1);
  listed.unshift({ id: "scratch" });

  const after = await listProposals();
  assert.equal(after.length, before + 1);
  assert.equal(after.at(-1).id, created.id);
  assert.ok(after.every((item) => item.id !== "scratch"));
});
