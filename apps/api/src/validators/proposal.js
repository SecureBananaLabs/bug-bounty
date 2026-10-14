import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  freelancerId: z.string().min(1, "freelancerId is required"),
  coverLetter: z.string().trim().min(1, "coverLetter cannot be empty"),
  bidAmount: z.number().positive("bidAmount must be positive"),
  estimatedDays: z.number().int().positive("estimatedDays must be positive")
});
