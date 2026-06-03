import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("createProposal assigns server-owned createdAt timestamps", async () => {
  const originalNow = Date.now;
  const RealDate = Date;
  const fixedDate = new RealDate("2026-06-03T12:00:00.000Z");

  Date.now = () => 123456;
  globalThis.Date = class extends RealDate {
    constructor(...args) {
      return args.length === 0 ? fixedDate : new RealDate(...args);
    }

    static now() {
      return fixedDate.getTime();
    }

    static parse(value) {
      return RealDate.parse(value);
    }

    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  };

  try {
    const proposal = await createProposal({
      id: "prp_client_supplied",
      jobId: "job_1",
      freelancerId: "usr_1",
      coverLetter: "I can help",
      bidAmount: 100,
      createdAt: "2000-01-01T00:00:00.000Z"
    });

    assert.equal(proposal.id, "prp_client_supplied");
    assert.equal(proposal.createdAt, "2026-06-03T12:00:00.000Z");

    const storedProposal = (await listProposals()).at(-1);
    assert.equal(storedProposal.createdAt, "2026-06-03T12:00:00.000Z");
  } finally {
    Date.now = originalNow;
    globalThis.Date = RealDate;
  }
});
