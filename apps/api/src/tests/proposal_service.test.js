import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, listProposals } from "../services/proposalService.js";

test("proposalService.createProposal generates unique collision-resistant IDs and prevents client override", async () => {
  // 1. Same-millisecond concurrent creation produces unique IDs
  const concurrentCalls = Array.from({ length: 20 }, (_, i) =>
    createProposal({
      jobId: "job_100",
      freelancerId: `freelancer_${i}`,
      bidAmount: 500 + i
    })
  );

  const results = await Promise.all(concurrentCalls);
  const ids = results.map((r) => r.id);
  const uniqueIds = new Set(ids);

  assert.equal(ids.length, 20);
  assert.equal(uniqueIds.size, 20, "All concurrent proposal IDs must be distinct");
  for (const id of ids) {
    assert.ok(id.startsWith("prp_"));
  }

  // 2. Caller-supplied ID override attempt is rejected
  const customIdAttempt = await createProposal({
    id: "injected_proposal_id_9999",
    jobId: "job_200",
    freelancerId: "freelancer_malicious",
    bidAmount: 1000
  });

  assert.notEqual(customIdAttempt.id, "injected_proposal_id_9999");
  assert.ok(customIdAttempt.id.startsWith("prp_"));
  assert.equal(customIdAttempt.jobId, "job_200");

  // 3. Confirm listed proposals reflect the correct server IDs
  const allProposals = await listProposals();
  const found = allProposals.find((p) => p.freelancerId === "freelancer_malicious");
  assert.ok(found);
  assert.equal(found.id, customIdAttempt.id);
  assert.notEqual(found.id, "injected_proposal_id_9999");
});
