import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  coverLetter: z.string().trim().min(10).max(5000),
  bidAmount: z.number().nonnegative(),
  estimatedDuration: z.string().trim().min(1).max(120)
});
