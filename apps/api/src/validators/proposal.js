import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1, "Job ID is required").max(64, "Job ID too long"),
  coverLetter: z.string().trim().min(10, "Cover letter must be at least 10 characters").max(5000, "Cover letter cannot exceed 5000 characters"),
  bidAmount: z.number().positive("Bid amount must be positive").max(1000000, "Bid amount cannot exceed 1,000,000"),
  estimatedDays: z.number().int("Estimated days must be an integer").min(1, "Estimated days must be at least 1").max(365, "Estimated days cannot exceed 365")
});
