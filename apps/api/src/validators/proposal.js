import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(10),
  estimatedDuration: z.number().positive("Estimated duration is required and must be positive"),
  estimatedBudget: z.number().nonnegative().optional(),
  availability: z.string().min(1).optional()
});
