import test from "node:test";
import assert from "node:assert/strict";
import { createProposal } from "../services/proposalService.js";

test("createProposal assigns server-created createdAt and ignores caller values", async () => {
  const OriginalDate = Date;

  class FixedDate extends OriginalDate {
    constructor(...args) {
      super(args.length > 0 ? args[0] : 1700000000000);
    }

    static now() {
      return 1700000000000;
    }
  }

  globalThis.Date = FixedDate;

  try {
    const result = await createProposal({
      title: "Proposal title",
      body: "Proposal body",
      createdAt: "2000-01-01T00:00:00.000Z"
    });

    assert.equal(result.id, "prp_1700000000000");
    assert.equal(result.createdAt, "2023-11-14T22:13:20.000Z");
    assert.equal(result.title, "Proposal title");
    assert.equal(result.body, "Proposal body");
  } finally {
    globalThis.Date = OriginalDate;
  }
});
