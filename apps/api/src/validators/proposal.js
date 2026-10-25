import { z } from "zod";

export const proposalSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().min(1),
  estimatedDuration: z.number().positive(),
  bidAmount: z.number().positive().optional()
});
