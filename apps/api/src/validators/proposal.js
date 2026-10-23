import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1, "Job ID is required").max(64, "Job ID too long"),
  coverLetter: z.string().trim().min(10, "Cover letter must be at least 10 characters").max(5000, "Cover letter cannot exceed 5000 characters"),
  bidAmount: z.number({ invalid_type_error: "Bid amount must be a number" }).positive("Bid amount must be greater than 0").max(1000000, "Bid amount cannot exceed 1,000,000"),
  estimatedDays: z.number({ invalid_type_error: "Estimated days must be a number" }).int("Estimated days must be an integer").positive("Estimated days must be greater than 0").max(365, "Estimated days cannot exceed 365")
});
