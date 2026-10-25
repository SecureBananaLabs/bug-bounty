import { describe, it, expect } from "vitest";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";

describe("createProposal - server-owned id", () => {
  it("should ignore caller-supplied id", async () => {
    const result = await createProposal({
      id: "prp_malicious",
      jobId: "job_123",
      freelancerId: "usr_456",
      coverLetter: "I can do this"
    });

    expect(result.id).toMatch(/^prp_\d+$/);
    expect(result.id).not.toBe("prp_malicious");
    expect(result.jobId).toBe("job_123");
  });
});

describe("createReview - server-owned id", () => {
  it("should ignore caller-supplied id", async () => {
    const result = await createReview({
      id: "rev_malicious",
      jobId: "job_123",
      rating: 5,
      comment: "Great work"
    });

    expect(result.id).toMatch(/^rev_\d+$/);
    expect(result.id).not.toBe("rev_malicious");
    expect(result.rating).toBe(5);
  });
});
