import assert from "node:assert/strict";
import test from "node:test";

import { postProposal } from "../controllers/proposalController.js";

function createMockResponse() {
  return {
    statusCode: undefined,
    body: undefined,

    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

function validProposal(overrides = {}) {
  return {
    jobId: "job-enterprise-routing-001",
    coverLetter:
      "I can design and deliver a reliable high-throughput routing solution for this engagement.",
    bidAmount: 2500,
    estimatedDuration: "3 weeks",
    freelancerId: "freelancer-architect-001",
    ...overrides,
  };
}

function assertValidationFailure(response, expectedPath) {
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
  assert.equal(response.body.error.message, "Invalid proposal payload");

  assert.ok(
    response.body.error.details.some((detail) => detail.path === expectedPath),
    `Expected a validation error for "${expectedPath}"`,
  );
}

test("POST /api/proposals accepts a valid proposal and generates an id", async () => {
  const res = createMockResponse();

  await postProposal(
    {
      body: validProposal(),
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.ok(res.body.data);
  assert.equal(typeof res.body.data.id, "string");
  assert.ok(res.body.data.id.length > 0);
  assert.equal(res.body.data.jobId, "job-enterprise-routing-001");
  assert.equal(res.body.data.bidAmount, 2500);
});

test("POST /api/proposals rejects a missing jobId", async () => {
  const { jobId, ...payloadWithoutJobId } = validProposal();
  const res = createMockResponse();

  await postProposal(
    {
      body: payloadWithoutJobId,
    },
    res,
  );

  assertValidationFailure(res, "jobId");
});

test("POST /api/proposals rejects a missing coverLetter", async () => {
  const { coverLetter, ...payloadWithoutCoverLetter } = validProposal();
  const res = createMockResponse();

  await postProposal(
    {
      body: payloadWithoutCoverLetter,
    },
    res,
  );

  assertValidationFailure(res, "coverLetter");
});

test("POST /api/proposals rejects a coverLetter shorter than 10 characters", async () => {
  const res = createMockResponse();

  await postProposal(
    {
      body: validProposal({ coverLetter: "Too short" }),
    },
    res,
  );

  assertValidationFailure(res, "coverLetter");
});

test("POST /api/proposals rejects a negative bidAmount", async () => {
  const res = createMockResponse();

  await postProposal(
    {
      body: validProposal({ bidAmount: -1 }),
    },
    res,
  );

  assertValidationFailure(res, "bidAmount");
});

test("POST /api/proposals rejects a zero bidAmount", async () => {
  const res = createMockResponse();

  await postProposal(
    {
      body: validProposal({ bidAmount: 0 }),
    },
    res,
  );

  assertValidationFailure(res, "bidAmount");
});

test("POST /api/proposals rejects unknown extraneous properties", async () => {
  const res = createMockResponse();

  await postProposal(
    {
      body: validProposal({
        internalPersistenceOverride: true,
      }),
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");

  assert.ok(
    res.body.error.details.some(
      (detail) => detail.code === "unrecognized_keys",
    ),
  );
});
