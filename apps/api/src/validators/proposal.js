import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  bidAmount: z.number().finite().positive(),
  coverLetter: z.string().min(10)
});
