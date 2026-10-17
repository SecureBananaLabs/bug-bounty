import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  userId: z.string().min(1),
  bidAmount: z.number().positive(),
  estimatedDuration: z.number().positive(),
  coverLetter: z.string().min(10)
});
