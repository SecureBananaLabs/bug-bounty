import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  rate: z.number().positive(),
  message: z.string().min(1)
});
