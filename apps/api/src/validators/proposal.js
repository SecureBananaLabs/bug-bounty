import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  coverLetter: z.string().trim().min(10).max(4000),
  bidAmount: z.number().positive(),
  estimatedDays: z.number().int().positive()
}).strict();
