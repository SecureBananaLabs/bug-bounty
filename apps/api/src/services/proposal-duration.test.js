import { createProposal } from "./proposalService.js";

describe("Proposal Creation Estimated Duration Requirement (#11593)", () => {
  it("should reject proposals missing estimatedDuration", async () => {
    await expect(createProposal({ title: "Test Proposal", budget: 500 })).rejects.toThrow();
  });

  it("should accept proposals with valid estimatedDuration", async () => {
    const res = await createProposal({ title: "Test Proposal", budget: 500, estimatedDuration: 10 });
    expect(res.id).toBeDefined();
    expect(res.estimatedDuration).toBe(10);
  });
});
