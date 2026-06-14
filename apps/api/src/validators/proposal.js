import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  bidAmount: z.number().positive(),
  coverLetter: z.string().min(1),
});
