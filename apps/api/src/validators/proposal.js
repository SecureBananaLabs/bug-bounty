import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(10),
  estimatedDuration: z.number().positive("estimatedDuration must be greater than 0")
});