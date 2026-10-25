import test from "node:test";
import assert from "node:assert/strict";
import { postProposal } from "../controllers/proposalController.js";
import { createProposalSchema } from "../validators/proposal.js";

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_freelancer",
  coverLetter: "I can deliver this API work with tests.",
  bidAmount: 250,
  estimatedDays: 5
};

function createResponse() {
  return {
    statusCode: 0,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("createProposalSchema rejects invalid proposal economics and empty cover letters", () => {
  assert.equal(createProposalSchema.safeParse({ ...validProposal, bidAmount: -1 }).success, false);
  assert.equal(createProposalSchema.safeParse({ ...validProposal, estimatedDays: 0 }).success, false);
  assert.equal(createProposalSchema.safeParse({ ...validProposal, estimatedDays: 1.5 }).success, false);
  assert.equal(createProposalSchema.safeParse({ ...validProposal, coverLetter: "" }).success, false);
});

test("createProposalSchema rejects missing identifiers", () => {
  assert.equal(createProposalSchema.safeParse({ ...validProposal, jobId: "" }).success, false);
  assert.equal(createProposalSchema.safeParse({ ...validProposal, freelancerId: "" }).success, false);
});

test("postProposal returns 400 before persisting invalid payloads", async () => {
  const response = createResponse();

  await postProposal({
    body: {
      jobId: "job_123",
      freelancerId: "usr_freelancer",
      coverLetter: "",
      bidAmount: -25,
      estimatedDays: -2
    }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Invalid proposal payload"
  });
});

test("postProposal persists validated proposal payloads", async () => {
  const response = createResponse();

  await postProposal({ body: validProposal }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.match(response.body.data.id, /^prp_/);
  assert.deepEqual(
    {
      jobId: response.body.data.jobId,
      freelancerId: response.body.data.freelancerId,
      coverLetter: response.body.data.coverLetter,
      bidAmount: response.body.data.bidAmount,
      estimatedDays: response.body.data.estimatedDays
    },
    validProposal
  );
});
