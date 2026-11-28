import { z } from "zod";

export const createProposalSchema = z
  .object({
    jobId: z.string().trim().min(1, "jobId is required").max(128),
    coverLetter: z.string().trim().min(10, "Cover letter must be at least 10 characters").max(5000),
    bidAmount: z.number().positive("Bid amount must be greater than 0").finite(),
    estimatedDuration: z.string().trim().min(1).max(100).optional(),
    freelancerId: z.string().trim().min(1).max(128).optional()
  })
  .strict();
