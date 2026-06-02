import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  freelancerId: z.string().min(1, "Freelancer ID is required"),
  bidAmount: z.number().positive("Bid amount must be positive"),
  estimatedDuration: z.string().min(1, "Estimated duration is required"),
  coverLetter: z.string().optional()
});

export const updateProposalSchema = createProposalSchema.partial();
