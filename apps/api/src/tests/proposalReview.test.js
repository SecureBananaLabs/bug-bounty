import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";

test("createProposal: server-generated id cannot be overridden by caller", async () => {
  const result = await createProposal({
    title: "Test proposal",
    id: "malicious_id_123",
    jobId: "job_1"
  });
  
  assert.ok(result.id.startsWith("prp_"));
  assert.notEqual(result.id, "malicious_id_123");
  assert.equal(result.title, "Test proposal");
});

test("createProposal: preserves non-id fields from payload", async () => {
  const result = await createProposal({
    title: "My proposal",
    jobId: "job_456",
    description: "A test"
  });
  
  assert.equal(result.title, "My proposal");
  assert.equal(result.jobId, "job_456");
  assert.equal(result.description, "A test");
  assert.ok(result.id.startsWith("prp_"));
});

test("createReview: server-generated id cannot be overridden by caller", async () => {
  const result = await createReview({
    rating: 5,
    comment: "Great work",
    id: "malicious_rev_id"
  });
  
  assert.ok(result.id.startsWith("rev_"));
  assert.notEqual(result.id, "malicious_rev_id");
  assert.equal(result.rating, 5);
});

test("createReview: preserves non-id fields from payload", async () => {
  const result = await createReview({
    rating: 4,
    comment: "Good",
    jobId: "job_1"
  });
  
  assert.equal(result.rating, 4);
  assert.equal(result.comment, "Good");
  assert.equal(result.jobId, "job_1");
  assert.ok(result.id.startsWith("rev_"));
});
