import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1),
  freelancerId: z.string().trim().min(1),
  coverLetter: z.string().trim().min(1).max(5000),
  bidAmount: z.number().nonnegative(),
  estimatedDays: z.number().int().positive()
});
