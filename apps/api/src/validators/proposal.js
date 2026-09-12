import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  userId: z.string().min(1),
  estimatedDuration: z.number().positive("estimatedDuration must be a positive number"),
  coverLetter: z.string().min(10),
  bidAmount: z.number().positive("bidAmount must be a positive number")
});
