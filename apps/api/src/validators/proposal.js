import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  bidAmount: z.number().positive(),
  coverLetter: z.string().min(10),
  estimatedDays: z.number().int().positive()
});
