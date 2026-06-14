import test from "node:test";
import assert from "node:assert/strict";
import { createProposalSchema } from "../validators/proposal.js";

test("createProposalSchema accepts valid payload", () => {
  assert.doesNotThrow(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
      estDuration: "5 days"
    });
  });
});

test("createProposalSchema rejects missing or blank estDuration", () => {
  // Missing estDuration
  assert.throws(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250
    });
  });

  // Blank estDuration
  assert.throws(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
      estDuration: ""
    });
  });
});

test("createProposalSchema rejects missing or invalid required fields", () => {
  // Missing jobId
  assert.throws(() => {
    createProposalSchema.parse({
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
      estDuration: "5 days"
    });
  });

  // Missing freelancerId
  assert.throws(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      coverLetter: "I can complete this safely.",
      bidAmount: 250,
      estDuration: "5 days"
    });
  });

  // Missing coverLetter
  assert.throws(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      freelancerId: "usr_456",
      bidAmount: 250,
      estDuration: "5 days"
    });
  });

  // Missing or negative bidAmount
  assert.throws(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      estDuration: "5 days"
    });
  });

  assert.throws(() => {
    createProposalSchema.parse({
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can complete this safely.",
      bidAmount: -10,
      estDuration: "5 days"
    });
  });
});
