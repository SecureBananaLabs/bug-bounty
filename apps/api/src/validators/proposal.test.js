import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCreateProposal } from "./proposal.js";

describe("Proposal Validation & Bid Amounts (#743)", () => {
  it("rejects non-positive bidAmount (<= 0)", () => {
    const res = validateCreateProposal({
      jobId: "job_123",
      freelancerId: "free_456",
      coverLetter: "I have 5 years experience with Node.js and TypeScript.",
      bidAmount: 0,
      estimatedDuration: "2 weeks"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "bidAmount must be a positive number greater than zero");
  });

  it("rejects short coverLetter (< 10 chars)", () => {
    const res = validateCreateProposal({
      jobId: "job_123",
      freelancerId: "free_456",
      coverLetter: "Short",
      bidAmount: 500,
      estimatedDuration: "2 weeks"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "coverLetter must be at least 10 characters");
  });

  it("accepts valid proposal payload", () => {
    const res = validateCreateProposal({
      jobId: "job_123",
      freelancerId: "free_456",
      coverLetter: "I have 5 years experience with Node.js and TypeScript.",
      bidAmount: 850,
      estimatedDuration: "3 weeks"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.bidAmount, 850);
    assert.equal(res.data.estimatedDuration, "3 weeks");
  });
});
