import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(10),
  estimatedDuration: z.number().positive("Estimated duration must be a positive number"),
  bidAmount: z.number().nonnegative().optional()
});