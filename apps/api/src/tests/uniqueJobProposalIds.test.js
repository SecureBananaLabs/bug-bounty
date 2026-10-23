import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";

describe("Same-Millisecond Unique Job & Proposal IDs (#12173, #12179)", () => {
  it("generates distinct job_ IDs even when Date.now() is frozen to the same millisecond", async () => {
    const originalNow = Date.now;
    Date.now = () => 1700000000000;
    try {
      const jobA = await createJob({ title: "Job Alpha", budget: 500 });
      const jobB = await createJob({ title: "Job Beta", budget: 900 });

      assert.match(jobA.id, /^job_[0-9a-f-]{36}$/);
      assert.match(jobB.id, /^job_[0-9a-f-]{36}$/);
      assert.notEqual(jobA.id, jobB.id);
      assert.equal(jobA.status, "open");
      assert.equal(jobB.status, "open");
    } finally {
      Date.now = originalNow;
    }
  });

  it("generates distinct prp_ IDs even when Date.now() is frozen to the same millisecond", async () => {
    const originalNow = Date.now;
    Date.now = () => 1700000000000;
    try {
      const propA = await createProposal({ jobId: "job_1", bidAmount: 300 });
      const propB = await createProposal({ jobId: "job_1", bidAmount: 450 });

      assert.match(propA.id, /^prp_[0-9a-f-]{36}$/);
      assert.match(propB.id, /^prp_[0-9a-f-]{36}$/);
      assert.notEqual(propA.id, propB.id);
    } finally {
      Date.now = originalNow;
    }
  });

  it("prevents caller-supplied payload.id from overriding server-generated IDs", async () => {
    const job = await createJob({ id: "job_spoofed", title: "Secure Job" });
    const proposal = await createProposal({ id: "prp_spoofed", jobId: job.id });

    assert.notEqual(job.id, "job_spoofed");
    assert.notEqual(proposal.id, "prp_spoofed");

    const allJobs = await listJobs();
    const allProposals = await listProposals();
    assert.ok(allJobs.some((j) => j.id === job.id));
    assert.ok(allProposals.some((p) => p.id === proposal.id));
  });
});
