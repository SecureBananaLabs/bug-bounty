import { describe, it, expect } from "vitest";
import { createProposalSchema } from "../validators/proposal.js";

describe("Proposal Validation Schema", () => {
  const valid = {
    jobId: "job_123",
    title: "I can build this",
    coverLetter: "I have 5 years of experience with this tech stack and can deliver in 2 weeks.",
    bidAmount: 1500
  };

  it("should accept a valid proposal", () => {
    const result = createProposalSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject missing jobId", () => {
    const { jobId, ...rest } = valid;
    const result = createProposalSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should reject title under 3 characters", () => {
    const result = createProposalSchema.safeParse({ ...valid, title: "AB" });
    expect(result.success).toBe(false);
  });

  it("should reject cover letter under 10 characters", () => {
    const result = createProposalSchema.safeParse({ ...valid, coverLetter: "Short" });
    expect(result.success).toBe(false);
  });

  it("should reject zero bid amount", () => {
    const result = createProposalSchema.safeParse({ ...valid, bidAmount: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative bid amount", () => {
    const result = createProposalSchema.safeParse({ ...valid, bidAmount: -100 });
    expect(result.success).toBe(false);
  });

  it("should reject title over 200 characters", () => {
    const result = createProposalSchema.safeParse({ ...valid, title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});
