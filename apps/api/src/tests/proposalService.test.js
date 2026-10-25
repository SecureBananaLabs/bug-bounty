import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal assigns a server-owned createdAt ISO timestamp", async () => {
  const before = Date.now();
  const proposal = await createProposal({ jobId: "job_1", bidAmount: 100 });
  const after = Date.now();

  assert.ok(typeof proposal.createdAt === "string", "createdAt should be a string");
  const parsed = Date.parse(proposal.createdAt);
  assert.ok(!Number.isNaN(parsed), "createdAt should parse as a valid date");
  assert.ok(parsed >= before && parsed <= after, "createdAt should fall between before/after timestamps");
  assert.equal(proposal.jobId, "job_1");
  assert.equal(proposal.bidAmount, 100);
});

test("createProposal ignores caller-supplied createdAt values", async () => {
  const proposal = await createProposal({
    jobId: "job_2",
    bidAmount: 200,
    createdAt: "1970-01-01T00:00:00.000Z",
  });
  const parsed = Date.parse(proposal.createdAt);
  assert.ok(parsed > 0, "createdAt should reflect server time, not caller-supplied epoch zero");
  assert.notEqual(proposal.createdAt, "1970-01-01T00:00:00.000Z");
});

test("createProposal returns the stored record via listProposals", async () => {
  const initialLength = (await listProposals()).length;
  const proposal = await createProposal({ jobId: "job_3", bidAmount: 300 });
  const stored = await listProposals();
  assert.equal(stored.length, initialLength + 1);
  assert.ok(stored.includes(proposal));
});
