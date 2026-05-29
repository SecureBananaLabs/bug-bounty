import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  coverLetter: z.string().min(10).max(2000),
  proposedBudget: z.number().positive(),
  estimatedDays: z.number().int().positive(),
});
